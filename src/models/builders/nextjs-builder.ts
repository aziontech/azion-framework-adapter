import { readFile, writeFile, mkdir, stat, readdir } from "fs/promises";
import { readFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join, relative, resolve } from "path";
import { tmpdir } from "os";
import { build } from "esbuild";

import { Builder } from "./builder";
import { ErrorCode } from '../../errors';
import ManifestBuilder from "../../manifest";


import util = require('node:util');

const exec = util.promisify(require('node:child_process').exec);

interface HydratedEntry {
    matchers: string,
    filepath: string
}

class NextjsBuilder extends Builder {
    dirname: string = dirname(__filename);
    functionsMap: Map<string, string> = new Map();
    tmpFunctionsDir: string = join(tmpdir(), Math.random().toString(36).slice(2));
    invalidFunctions: string[] = [];
    hydratedMiddleware: Map<string, HydratedEntry> = new Map();
    hydratedFunctions: Map<string, HydratedEntry> = new Map();
    middlewareEntries: any;
    functionsEntries: any;

    constructor(targetDir: string) {
        super(targetDir);
    }

    async createVercelProjectConfig() {
        console.log("Creating project config file ...");

        try {
            const projectConfigDir = '.vercel';
            const projectConfigFilePath = `${projectConfigDir}/project.json`;

            if (!existsSync(projectConfigFilePath)) {
                if (!existsSync(projectConfigDir)) {
                    mkdirSync(projectConfigDir);
                }

                await writeFile(projectConfigFilePath, '{"projectId":"_","orgId":"_","settings":{}}');
            }
        } catch (error) {
            const message = `Error: ${error}`;
            console.log(message)
            throw Error(message)
        }
    }

    async runVercelBuild() {
        // https://vercel.com/docs/build-output-api/v3
        console.log("Running initial build ...");

        try {
            await exec('npx --yes vercel@28.16.11 build --prod');
        } catch (error) {
            const message = `Error: ${error}`;
            console.log(message)
            throw Error(message)
        }
    }

    loadVercelConfigs(): any {
        console.log("Loading configs ...")

        try {
            const fileContent = readFileSync(".vercel/output/config.json", "utf8");
            const config = JSON.parse(fileContent);

            return config;
        } catch (error) {
            const message = `Error: ${error}`;
            console.log(message)
            throw Error(message)
        }
    }

    async detectBuildedFunctions() {
        console.log("Detecting builded functions ...")

        let functionsExist = false;

        try {
            const functionsDir = resolve(".vercel/output/functions");

            await stat(functionsDir);

            functionsExist = true;
        } catch (error) {
            if (!functionsExist) {
                console.log("No functions detected")
            } else {
                console.log(error)
            }

            throw Error("Failed in detect builded functions.")
        }
    }

    // function to walk in builded functions dir, detect invalid functions and adapt content
    async dirWalk(dir: string, functionsDir: string) {
        try {
            const files = await readdir(dir);

            await Promise.all(
                files.map(async (file) => {
                    const filepath = join(dir, file);
                    const isDirectory = (await stat(filepath)).isDirectory();
                    const relativePath = relative(functionsDir, filepath);

                    if (isDirectory && filepath.endsWith(".func")) {
                        const name = relativePath.replace(/\.func$/, "");

                        const functionConfigFile = join(filepath, ".vc-config.json");
                        let functionConfig;
                        try {
                            const contents = await readFile(functionConfigFile, "utf8");
                            functionConfig = JSON.parse(contents);
                        } catch {
                            this.invalidFunctions.push(file);
                        }

                        if (functionConfig.runtime !== "edge") {
                            this.invalidFunctions.push(name);
                        }

                        const functionFile = join(filepath, functionConfig.entrypoint);
                        let functionFileExists = false;
                        try {
                            await stat(functionFile);
                            functionFileExists = true;
                        } catch { }

                        if (!functionFileExists) {
                            this.invalidFunctions.push(name);
                        }

                        let contents = await readFile(functionFile, "utf8");
                        contents = contents.replace(
                            // TODO: This hack is not good. We should replace this with something less brittle ASAP
                            /Object.defineProperty\(globalThis,\s*"__import_unsupported",\s*{[^}]*}\)/gm,
                            ""
                        );

                        // minify removed !

                        const newFilePath = join(this.tmpFunctionsDir, `${relativePath}.js`);
                        await mkdir(dirname(newFilePath), { recursive: true });
                        await writeFile(newFilePath, contents);

                        this.functionsMap.set(
                            relative(functionsDir, filepath).slice(0, -".func".length),
                            newFilePath
                        );
                    } else if (isDirectory) {
                        await this.dirWalk(filepath, functionsDir);
                    }
                })
            );
        } catch (error) {
            const message = `Error: ${error}`;
            console.log(message)
            throw Error(message)
        }
    }

    async handleMiddleware() {
        console.log("Handling middleware ...");

        try {
            let middlewareManifest: any = {};

            middlewareManifest = JSON.parse(
                await readFile(".next/server/middleware-manifest.json", "utf8")
            );

            this.middlewareEntries = Object.values(middlewareManifest.middleware);
            this.functionsEntries = Object.values(middlewareManifest.functions);

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
        } catch (error) {
            const message = `Error: ${error}`;
            console.log(message)
            throw Error(message)
        }
    }

    async writeFunctionsReferencesFile(functionsFile: string) {
        console.log("writing references file ...")

        try {
            await writeFile(
                functionsFile,
                `
                export const __FUNCTIONS__ = {${[...this.hydratedFunctions.entries()]
                    .map(
                        ([name, { matchers, filepath }]) =>
                            `"${name}": { matchers: ${JSON.stringify(
                                matchers
                            )}, entrypoint: require('${filepath}')}`
                    )
                    .join(",")}};

                  export const __MIDDLEWARE__ = {${[...this.hydratedMiddleware.entries()]
                    .map(
                        ([name, { matchers, filepath }]) =>
                            `"${name}": { matchers: ${JSON.stringify(
                                matchers
                            )}, entrypoint: require('${filepath}')}`
                    )
                    .join(",")}};`
            );
        } catch (error) {
            const message = `Error: ${error}`;
            console.log(message)
            throw Error(message)
        }
    }

    async buildWorker(params: any): Promise<any> {
        console.log("Building azion worker ...")

        try {
            await build({
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
        } catch (error) {
            const message = `Error: ${error}`;
            console.log(message)
            throw Error(message)
        }
    }

    async build(params: any): Promise<ErrorCode> {
        console.log("Running nextjs application build ...");

        if (!params.versionId) {
            console.log("Missing version-id. This arg must be provided to build!")

            return ErrorCode.FailedToBuild;
        }

        try {
            await this.createVercelProjectConfig();

            await this.runVercelBuild();

            const config = this.loadVercelConfigs();

            await this.detectBuildedFunctions();

            const functionsDir = resolve(".vercel/output/functions");

            console.log("Mapping and transforming functions ...")
            await this.dirWalk(functionsDir, functionsDir);

            await this.handleMiddleware();

            const assetsDir = join(this.targetDir, ".vercel/output/static")
            const assetsManifest = ManifestBuilder.assetsPaths(assetsDir);

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
        } catch (error) {
            console.log("Error in nextjs build process");
            console.log(error);

            return ErrorCode.Unknown;
        }

        return ErrorCode.Ok;
    }
}

export { NextjsBuilder }
