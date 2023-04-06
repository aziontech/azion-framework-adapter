import { dirname, join, resolve } from "path";
import { readFileSync, statSync } from "fs";
import { writeFile } from "fs/promises";
import * as esbuild from "esbuild";
import { tmpdir } from "os";

import {
    FailedToBuild,
    BuildedFunctionsNotFound,
    MiddlewareManifestHandlerError
} from "./errors/errors";
import { Builder } from "./builder";
import { ErrorCode } from '../../errors';
import { VercelService } from "./services/vercel-service";
import { ManifestBuilderService } from "./services/manifest-builder-service";

interface HydratedEntry {
    matchers: string,
    filepath: string
}

class NextjsBuilder extends Builder {
    hydratedMiddleware: Map<string, HydratedEntry> = new Map();
    hydratedFunctions: Map<string, HydratedEntry> = new Map();
    functionsMap: Map<string, string> = new Map();
    dirname: string = dirname(__filename);
    middlewareEntries: any;
    functionsEntries: any;
    manifestBuilderService = new ManifestBuilderService();
    vercelService = new VercelService();
    esbuild = esbuild;


    constructor(targetDir: string) {
        super(targetDir);
    }

    handleMiddleware() {
        console.log("Handling middleware ...");

        try {
            let middlewareManifest: any = {};

            middlewareManifest = JSON.parse(
                readFileSync(".next/server/middleware-manifest.json","utf8")
            );

            if(!middlewareManifest.middleware || !middlewareManifest.functions){
                throw new MiddlewareManifestHandlerError('Missing properties in middleware-manifest.json');
            }

            this.middlewareEntries = Object.values(middlewareManifest.middleware);
            this.functionsEntries = Object.values(middlewareManifest.functions);

            if(this.functionsMap.size <= 0){
                throw new MiddlewareManifestHandlerError('No functions was provided');
            }

            for (const [name, filepath] of this.functionsMap) {
                if (name === "middleware" && this.middlewareEntries.length > 0) {
                    for (const entry of this.middlewareEntries) {
                        if ("middleware" === entry?.name) {
                            this.hydratedMiddleware.set(name, { matchers: entry.matchers, filepath });
                        }
                    }
                }

                for (const entry of this.functionsEntries) {
                    if (`pages/${name}` === entry?.name) {
                        this.hydratedFunctions.set(name, { matchers: entry.matchers, filepath });
                    }
                }
            }
        } catch (error:any) {
            throw new MiddlewareManifestHandlerError(error.message);
        }
    }

    async writeFunctionsReferencesFile(functionsFile: string) {
        console.log("writing references file ...");
        try {
            await writeFile(functionsFile,this.getFunctionsReferenceFileTemplate());        
        } catch (error:any) {
            throw new Error(error.message + '$$aqui$$');
        }
    }

    private getFunctionsReferenceFileTemplate():string{
        return  `export const __FUNCTIONS__ = {
                    ${[...this.hydratedFunctions.entries()].map(([name, { matchers, filepath }]) =>`"${name}": { 
                        matchers: ${JSON.stringify(matchers)},
                        entrypoint: require('${filepath}')}`).join(",")}
                };
                export const __MIDDLEWARE__ = {
                    ${[...this.hydratedMiddleware.entries()].map(([name, { matchers, filepath }]) =>`"${name}": {
                        matchers: ${JSON.stringify(matchers)},
                        entrypoint: require('${filepath}')}`).join(",")}
                };
        `;
    }

    async buildWorker(params: any): Promise<any> {
        console.log("Building azion worker ...")

        try {
            await this.esbuild.build({
                entryPoints: [join(this.dirname, "../../templates/handlers/nextjs/handler.js")],
                bundle: true,
                inject: [
                    params.functionsFile,
                    join(this.dirname, "../../templates/handlers/nextjs/globals.js"),
                ],
                minify: true,
                target: "es2021",
                platform: "neutral",
                define: {
                    __CONFIG__: JSON.stringify(params.config),
                    __VERSION_ID__: `'${params.versionId}'`,
                    __ASSETS_MANIFEST__: JSON.stringify(params.assetsManifest)
                },
                outfile: "./out/worker.js",
            });

            console.log("Generated './out/worker.js'.");
        } catch (error: any) {
            throw new Error(error.message);
        }
    }

    async build(params: any): Promise<ErrorCode> {
        console.log("Running nextjs application build ...");

        if (!params.versionId) {
            const errorMessage = "Missing version-id. This arg must be provided to build!";
            console.log(errorMessage);
            throw new FailedToBuild(errorMessage);
        }

        try {
            this.vercelService.createVercelProjectConfig();

            await this.vercelService.runVercelBuild();

            const config = this.vercelService.loadVercelConfigs();

            this.vercelService.detectBuildedFunctions();

            console.log("Mapping and transforming functions ...");

            this.functionsMap = this.vercelService.adapt();

            this.handleMiddleware();

            const assetsDir = join(this.targetDir, ".vercel/output/static");
            const assetsManifest = this.manifestBuilderService.assetsPaths(assetsDir);

            const functionsFile = join(
                tmpdir(),
                `functions-${Math.random().toString(36).slice(2)}.js`
            );
            
            await this.writeFunctionsReferencesFile(functionsFile);

            const buildParams = {
                versionId: params.versionId,
                functionsFile,
                config,
                assetsManifest
            };
            await this.buildWorker(buildParams);
        } catch (error:any) {
            console.log("Error in nextjs build process");
            throw new FailedToBuild(error.message);
        }

        return ErrorCode.Ok;
    }
}

export { NextjsBuilder }