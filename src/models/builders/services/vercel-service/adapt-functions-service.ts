import { mkdirSync, readFileSync, writeFileSync} from "fs";
import { dirname, join, relative } from "path";

import glob from "fast-glob";

import { VcConfigError } from "../errors/error";
import { handlePrerenderedRoutes } from "./fix-prerendered-routes";
import { formatRoutePath, stripIndexRoute } from "../../../../utils/routing";
import { normalizePath, validateFile } from "../../../../utils/fs";


function isVcConfigValid(vcConfig: VercelFunctionConfig): boolean{
    const validRuntime = (vcConfig.runtime === "edge") || (vcConfig.runtime === "experimental-edge");
    const validEntrypoint = vcConfig["entrypoint"] !== undefined;

    return validRuntime && validEntrypoint; 
}

/**
 * Fixes the function contents in miscellaneous ways.
 *
 * Note: this function contains hacks which are quite brittle and should be improved ASAP.
 *
 * @param content the original function's file content
 * @returns the updated/fixed content
 */
function fixFunctionContent(content: string): string {
    content = content.replace(
        // reference: https://github.com/vercel/next.js/blob/2e7dfca362931be99e34eccec36074ab4a46ffba/packages/next/src/server/web/adapter.ts#L276-L282
        /(Object.defineProperty\(globalThis,\s*"__import_unsupported",\s*{[\s\S]*?configurable:\s*)([^,}]*)(.*}\s*\))/gm,
        '$1true$3'
    );

    // TODO: check this replace
    // The workers runtime does not implement certain properties like `mode` or `credentials`.
    // Due to this, we need to replace them with null so that request deduping cache key generation will work.
    // reference: https://github.com/vercel/next.js/blob/canary/packages/next/src/compiled/react/cjs/react.shared-subset.development.js#L198
    content = content.replace(
        /(?:(JSON\.stringify\(\[\w+\.method\S+,)\w+\.mode(,\S+,)\w+\.credentials(,\S+,)\w+\.integrity(\]\)))/gm,
        '$1null$2null$3null$4'
    );

    return content;
}

/**
 * Process the invalid functions and check whether and valid function was created in the functions
 * map to override it.
 *
 * The build output sometimes generates invalid functions at the root, while still creating the
 * valid functions. With the base path and route groups, it might create the valid edge function
 * inside a folder for the route group, but create an invalid one that maps to the same path
 * at the root.
 *
 * When we process the directory, we might add the valid function to the map before we process the
 * invalid one, so we need to check if the invalid one was added to the map and remove it from the
 * set if it was.
 *
 * If the invalid function is an RSC function (e.g. `path.rsc`) and doesn't have a valid squashed
 * version, we check if a squashed non-RSC function exists (e.g. `path`) and use this instead. RSC
 * functions are the same as non-RSC functions, per the Vercel source code.
 * https://github.com/vercel/vercel/blob/main/packages/next/src/server-build.ts#L1193
 *
 * @param processingResults Object containing the results of processing the current function directory.
 */
async function tryToFixInvalidFunctions({
    functionsMap,
    invalidFunctions,
}: ApplicationMapping): Promise<void> {
    if (invalidFunctions.size === 0) {
        return;
    }

    for (const rawPath of invalidFunctions) {
        const formattedPath = formatRoutePath(rawPath);

        if (
            functionsMap.has(formattedPath) ||
			functionsMap.has(stripIndexRoute(formattedPath))
        ) {
            invalidFunctions.delete(rawPath);
        } else if (formattedPath.endsWith('.rsc')) {
            const value = functionsMap.get(formattedPath.replace(/\.rsc$/, ''));

            if (value) {
                functionsMap.set(formattedPath, value);
                invalidFunctions.delete(rawPath);
            }
        }
    }
}

async function adaptFunction(applicationMapping: ApplicationMapping, tmpFunctionsDir: string, vcObject: VcConfigObject) {
    const functionsDir = join('.vercel', 'output', 'functions');
    const path = vcObject.path.replace("/.vc-config.json", "");

    // There are instances where the build output will generate an uncompiled `middleware.js` file that is used as the entrypoint.
    // TODO: investigate when and where the file is generated.
    // This file is not able to be used as it is uncompiled, so we try to instead use the compiled `index.js` if it exists.
    let isMiddleware = false;
    if (vcObject.content.entrypoint === 'middleware.js') {
        isMiddleware = true;
        console.log("   Founded middleware!")
        vcObject.content.entrypoint = 'index.js';
    }

    const codePath = join(path, vcObject.content.entrypoint);
    const relativePath = relative(functionsDir, path);

    if (!(await validateFile(codePath))) {
        if (isMiddleware) {
            // We sometimes encounter an uncompiled `middleware.js` with no compiled `index.js` outside of a base path.
            // Outside the base path, it should not be utilised, so it should be safe to ignore the function.
            console.log(
                `Detected an invalid middleware function for ${path}. Skipping...`
            );
            return {};
        }

        applicationMapping.invalidFunctions.add(path);
    }

    const newFileContent = fixFunctionContent(readFileSync(codePath, "utf8"));
    const newFilePath = join(tmpFunctionsDir, 'functions', `${relativePath}.js`);
    mkdirSync(dirname(newFilePath), { recursive: true });
    writeFileSync(newFilePath, newFileContent);

    // TODO: fix wasm imports - Maybe inject wasm? or send to storage?
    // reference: src/buildApplication/generateFunctionsMap.ts -> l392-l451
    
    // TODO: extract webpack chunks

    const formattedPathName = formatRoutePath(relativePath);
    const normalizedFilePath = normalizePath(newFilePath);

    applicationMapping.functionsMap.set(formattedPathName, normalizedFilePath);

    if (formattedPathName.endsWith('/index')) {
        // strip `/index` from the path name as the build output config doesn't rewrite `/index` to `/`
        applicationMapping.functionsMap.set(stripIndexRoute(formattedPathName), normalizedFilePath);
    }
}

// function to walk in builded functions dir, detect invalid functions and adapt content
export async function adapt(applicationMapping: ApplicationMapping, tmpFunctionsDir: string) {
    try{
        const vcConfigPaths: Array<string> = glob.sync(".vercel/output/functions/**/.vc-config.json");
        const vcConfigObjects: Array<VcConfigObject> = vcConfigPaths.map(file => {
            return {
                path: file,
                content: JSON.parse(readFileSync(file, "utf8")) as VercelFunctionConfig,
            }
        });

        const vcObjects = {
            invalid: vcConfigObjects.filter(vcConfig =>  !isVcConfigValid(vcConfig.content)),
            valid: vcConfigObjects.filter(vcConfig =>  isVcConfigValid(vcConfig.content)),
        }

        if (vcObjects.invalid.length > 0) {
            const invalidFunctionsList = vcObjects.invalid
                .filter( invalidFunction => !invalidFunction.path.includes('_next/data'))
                .map( invalidFunction => invalidFunction.path.replace(/^\.vercel\/output\/functions\/|\.\w+\/\.vc-config\.json$/g, ''));
            const invalidFunctionsString = invalidFunctionsList.join('\n')
            console.log('--->\n',new VcConfigError(invalidFunctionsString).message,'\n<------');
            throw new VcConfigError(invalidFunctionsString);
        }

        const validVcConfigPaths = vcObjects.valid.map(cfg => cfg.path);
        await handlePrerenderedRoutes(
            validVcConfigPaths, applicationMapping.prerenderedRoutes
        );

        try {
            await Promise.all(
                vcObjects.valid.map((vcObject) => adaptFunction(
                    applicationMapping,
                    tmpFunctionsDir,
                    vcObject
                ))
            );
        } catch (error) {
            const message = `Error adapting functions: ${error}`;
            console.log(message);
            throw Error(message);
        }

        await tryToFixInvalidFunctions(applicationMapping);
    } catch(error: any) {
        throw new Error(error.message);
    }
}
