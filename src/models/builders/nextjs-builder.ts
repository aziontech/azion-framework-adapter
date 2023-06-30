import { dirname, join } from "path";
import { writeFileSync, rmSync } from "fs";
import * as esbuild from "esbuild";
import { tmpdir } from "os";
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'

import { FailedToBuild, MiddlewareManifestHandlerError } from "./errors/errors";
import { Builder } from "./builder";
import { ErrorCode } from "../../errors";
import * as vcService from "./services/vercel-service";

import { ManifestBuilderService } from "./services/manifest-builder-service";
import { nodeBuiltInModulesPlugin } from "./plugins/esbuild-plugins";

class NextjsBuilder extends Builder {
    manifestBuilderService = new ManifestBuilderService();
    tmpFunctionsDir: string = join(tmpdir(), Math.random().toString(36).slice(2));
    vercelService = vcService;
    esbuild = esbuild;
    dirname: string = dirname(__filename);

    applicationMapping: ApplicationMapping = {
        invalidFunctions: new Set<string>(),
        functionsMap: new Map<string, string>(),
        webpackChunks: new Map<number, string>(),
        wasmIdentifiers: new Map<string, WasmModuleInfo>(),
        prerenderedRoutes: new Map<string, PrerenderedFileData>(),
    };

    constructor(targetDir: string) {
        super(targetDir);
    }

    /**
   * Construct a record for the build output map.
   *
   * @param item The build output item to construct a record for.
   * @returns Record for the build output map.
   */
    constructBuildOutputRecord(item: BuildOutputItem) {
        if (item.type === "static") {
            return `{ type: ${JSON.stringify(item.type)} }`;
        }

        if (item.type === "override") {
            return `{
				type: ${JSON.stringify(item.type)},
				path: ${item.path ? JSON.stringify(item.path) : undefined},
				headers: ${item.headers ? JSON.stringify(item.headers) : undefined}
			}`;
        }

        return `{
				type: ${JSON.stringify(item.type)},
				entrypoint: require('${item.entrypoint}')
			}`;
    }

    async writeOutputReferencesFile(
        functionsFile: string,
        vercelOutput: ProcessedVercelBuildOutput
    ) {
        console.log("writing references file ...");
        try {
            writeFileSync(
                functionsFile,
                `export const __BUILD_OUTPUT__ = {${[...vercelOutput.entries()]
                    .map(
                        ([name, item]) =>
                            `"${name}": ${this.constructBuildOutputRecord(item)}`
                    )
                    .join(",")}};`
            );
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    async buildWorker(params: any) {
        console.log("Building azion worker ...");

        try {
            await this.esbuild.build({
                entryPoints: [
                    join(this.dirname, "../../templates/handlers/nextjs/index.js"),
                ],
                bundle: true,
                inject: [
                    join(this.dirname, "../../templates/handlers/nextjs/libs.js"),
                    params.outputReferencesFilePath,
                    join(this.dirname, "../../templates/handlers/nextjs/globals.js"),
                ],
                minify: true,
                target: "es2022",
                platform: "neutral",
                define: {
                    __CONFIG__: JSON.stringify(params.config),
                    __VERSION_ID__: `'${params.versionId}'`,
                },
                outfile: "./out/worker.js",
                plugins: [nodeBuiltInModulesPlugin, NodeModulesPolyfillPlugin()]
            });

            console.log("Generated './out/worker.js'.");
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    deleteTelemetryFiles() {
        const dirPath = join(".vercel", "output", "static", "_next", "__private");

        rmSync(dirPath, { force: true, recursive: true });
    }

    async build(params: any): Promise<ErrorCode> {
        console.log("Running nextjs application build ...");

        if (!params.versionId) {
            const errorMessage =
        "Missing version-id. This arg must be provided to build!";
            console.log(errorMessage);
            throw new FailedToBuild(errorMessage);
        }

        try {
            this.vercelService.createVercelProjectConfig();

            this.vercelService.runVercelBuild();

            // unnecessary files that must not be accessible
            this.deleteTelemetryFiles();

            const config: VercelConfig = this.vercelService.loadVercelConfigs();

            this.vercelService.detectBuildedFunctions();

            console.log("Mapping and transforming functions ...");

            // adapt functions and set application mapping
            await this.vercelService.adapt(this.applicationMapping, this.tmpFunctionsDir);

            if (this.applicationMapping.functionsMap.size <= 0) {
                throw new MiddlewareManifestHandlerError("No functions was provided");
            }

            const assetsDir = join(this.targetDir, ".vercel/output/static");
            const assetsManifest: string[] =
            this.manifestBuilderService.assetsPaths(assetsDir);

            const processedVercelOutput: ProcessedVercelOutput = this.vercelService.processVercelOutput(
                config,
                assetsManifest,
                this.applicationMapping.prerenderedRoutes,
                this.applicationMapping.functionsMap
            );

            const outputReferencesFilePath = join(
                tmpdir(),
                `functions-${Math.random().toString(36).slice(2)}.js`
            );
            this.writeOutputReferencesFile(
                outputReferencesFilePath,
                processedVercelOutput.vercelOutput
            );

            const buildParams = {
                versionId: params.versionId,
                outputReferencesFilePath,
                config: processedVercelOutput.vercelConfig,
                assetsManifest,
            };

            await this.buildWorker(buildParams);

            return ErrorCode.Ok;
        } catch (error: any) {
            console.log("Error in nextjs build process");

            throw new FailedToBuild(error.message);
        }
    }
}

export { NextjsBuilder };
