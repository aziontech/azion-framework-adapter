import { resolve } from "path";
import { execSync } from "child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync,rmSync} from "fs";

import { addLeadingSlash, stripIndexRoute } from "../../../../utils/routing";
import { CannotWriteFile, VercelProjectError, VercelLoadConfigError, BuildedFunctionsNotFound } from "../errors/error";


function processVercelConfig(
    config: VercelConfig
): ProcessedVercelConfig {
    const processedConfig: ProcessedVercelConfig = {
        ...config,
        routes: {
            none: [],
            filesystem: [],
            miss: [],
            rewrite: [],
            resource: [],
            hit: [],
            error: [],
        },
    };

    let currentPhase: VercelHandleValue | 'none' = 'none';
    config.routes?.forEach(route => {
        if ('handle' in route) {
            currentPhase = route.handle;
        } else {
            processedConfig.routes[currentPhase].push(route);
        }
    });

    return processedConfig;
}

/**
 * Collect all middleware paths from the Vercel build output config.
 *
 * @param routes Processed routes from the Vercel build output config.
 * @returns Set of middleware paths.
 */
function collectMiddlewarePaths(routes: VercelSource[]): Set<string> {
    return new Set(
        routes.map(route => route.middlewarePath ?? '').filter(Boolean)
    );
}

/**
 * Rewrite middleware paths in the functions map to match the build output config.
 *
 * In the build output config, the `middlewarePath` value is used to denote where the entry point
 * for a middleware function is located. This path does not have a leading slash.
 *
 * For matching requests in the routing system, we use the path name from the request and check
 * against the map of functions. The path name from the request will have a leading slash.
 *
 * It might be possible to accidentally call a middleware function if the request path name matches
 * the middleware path name in the functions map, so to avoid accidental calls, and to match the
 * value in the build output config, we remove the leading slash from the key in the map for each
 * middleware path.
 *
 * @param processedOutput Map of path names to function entries.
 * @param middlewarePaths Set of middleware paths.
 */
function rewriteMiddlewarePaths(
    processedOutput: Map<string, BuildOutputItem>,
    middlewarePaths: Set<string>
): void {
    for (const middlewarePath of middlewarePaths) {
        const withLeadingSlash = addLeadingSlash(middlewarePath);
        const entry = processedOutput.get(withLeadingSlash);

        if (entry?.type === 'function') {
            processedOutput.set(middlewarePath, { ...entry, type: 'middleware' });
            processedOutput.delete(withLeadingSlash);
        } else {
            console.log(`Middleware path '${middlewarePath}' does not have a function.`);
        }
    }
}

/**
 * Apply the overrides from the Vercel build output config to the processed output map.
 *
 * The overrides are used to override the output of a static asset. This includes the path name it
 * will be served from, and the content type.
 *
 * @example
 * ```
 * // Serve the static file `500.html` from the path `/500` with the content type `text/html`.
 * { '500.html': { path: '500', contentType: 'text/html' } }
 * ```
 *
 * @link https://vercel.com/docs/build-output-api/v3/configuration#overrides
 *
 * @param vercelConfig Processed Vercel build output config.
 * @param vercelOutput Map of path names to function entries.
 */
function applyVercelOverrides(
    { overrides }: ProcessedVercelConfig,
    vercelOutput: Map<string, BuildOutputItem>
): void {
    Object.entries(overrides ?? []).forEach(
        ([rawAssetPath, { path: rawServedPath, contentType }]) => {
            const assetPath = addLeadingSlash(rawAssetPath);
            const servedPath = addLeadingSlash(rawServedPath ?? '');

            const newValue: BuildOutputStaticOverride = {
                type: 'override',
                path: assetPath,
                headers: contentType ? { 'content-type': contentType } : undefined,
            };

            // Update the existing static record to contain the new `contentType` and `assetPath`.
            const existingStaticRecord = vercelOutput.get(assetPath);
            if (existingStaticRecord?.type === 'static') {
                vercelOutput.set(assetPath, newValue);
            }

            // Add the new served path to the map, overriding the existing record if it exists.
            if (servedPath) {
                vercelOutput.set(servedPath, newValue);
            }

            // If the served path is an index route, add a squashed version of the path to the map.
            const strippedServedPath = stripIndexRoute(servedPath);
            if (strippedServedPath !== servedPath) {
                vercelOutput.set(strippedServedPath, newValue);
            }
        }
    );
}

/**
 * Apply the prerendered routes and their overrides to the processed output map.
 *
 * @param prerenderedRoutes Prererendered routes to apply to the output map.
 * @param vercelOutput Map of path names to build output items.
 */
function applyPrerenderedRoutes(
    prerenderedRoutes: Map<string, PrerenderedFileData>,
    vercelOutput: Map<string, BuildOutputItem>
): void {
    prerenderedRoutes.forEach(({ headers, overrides }, path) => {
        if(path !== '/favicon.ico') {
            vercelOutput.set(path, {
                type: 'override',
                path,
                headers,
            });
        }

        overrides?.forEach(overridenPath => {
            vercelOutput.set(overridenPath, {
                type: 'override',
                path,
                headers,
            });
        });
    });
}

/**
 * Take the static assets and functions that are read from the file system and turn them into a map
 * that can be consumed by the routing system.
 *
 * @param config Vercel build output config.
 * @param staticAssets List of static asset paths from the file system.
 * @param prerenderedRoutes Map of prerendered files from the file system.
 * @param functionsMap Map of functions from the file system.
 * @returns Processed Vercel build output map.
 */
export function processVercelOutput(
    config: VercelConfig,
    staticAssets: string[],
    prerenderedRoutes = new Map<string, PrerenderedFileData>(),
    functionsMap = new Map<string, string>()
): ProcessedVercelOutput {
    const processedConfig = processVercelConfig(config);

    const processedOutput = new Map<string, BuildOutputItem>(
        staticAssets.map(path => [path, { type: 'static' }])
    );

    functionsMap.forEach((value, key) => {
        processedOutput.set(key, {
            type: 'function',
            // NOTE: We replace the `.rsc.func.js` extension with `.func.js` as RSC functions have the
            // same exact content (and hash) as their non-rsc counterpart, so we opt to use the latter instead.
            // This also resolves an unclear runtime error that happens during routing when rsc functions are bundled:
            // `TypeError: Cannot read properties of undefined (reading 'default')`
            entrypoint: value.replace(/\.rsc\.func\.js$/i, '.func.js'),
        });

        // Remove the RSC functions from the dist directory as they are not needed since we replace them with non-rsc variants for the runtime routing
        if (/\.rsc\.func\.js$/i.test(value)) {
            rmSync(value);
        }
    });

    // Apply the overrides from the build output config to the processed output map.
    applyVercelOverrides(processedConfig, processedOutput);

    // Apply the prerendered routes and their overrides to the processed output map.
    applyPrerenderedRoutes(prerenderedRoutes, processedOutput);

    rewriteMiddlewarePaths(
        processedOutput,
        collectMiddlewarePaths(processedConfig.routes.none)
    );

    return {
        vercelConfig: processedConfig,
        vercelOutput: processedOutput,
    };
}

export function detectBuildedFunctions() {
    console.log("Detecting builded functions ...");
    try {
        const functionsDir = resolve(".vercel/output/functions");
        statSync(functionsDir);
    } catch (error:any) {
        throw new BuildedFunctionsNotFound(error.message);
    }
}

export function createVercelProjectConfig() {
    console.log("Creating project config file ...");

    try {
        const projectConfigDir = '.vercel';
        const projectConfigFilePath = `${projectConfigDir}/project.json`;

        if (!existsSync(projectConfigFilePath)) {
            if (!existsSync(projectConfigDir)) {
                mkdirSync(projectConfigDir);
            }

            writeFileSync(projectConfigFilePath,'{"projectId":"_","orgId":"_","settings":{}}');
        }
    } catch (error:any) {
        throw new CannotWriteFile(error.message);
    }
}

export function runVercelBuild() {
    // https://vercel.com/docs/build-output-api/v3
    console.log("Running initial build ...");

    try {
        execSync('npx --yes vercel@30.2.1 build --prod');
    } catch (error:any) {
        throw new VercelProjectError(error.message);
    }
}

export function loadVercelConfigs(): any {
    console.log("Loading configs ...")

    try {
        const fileContent = readFileSync(".vercel/output/config.json", "utf8");
        const config = JSON.parse(fileContent);

        return config;
    } catch (error:any) {
        throw new VercelLoadConfigError(error.message);
    }
}