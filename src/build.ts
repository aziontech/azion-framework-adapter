import * as fs from 'fs';
import path from 'path';
import process from 'process';
import webpack from 'webpack';
import merge from "webpack-merge";

import { AssetPublisher } from './asset-publisher';
import { BOOTSTRAP_CODE } from "./bootstraps/common";
import { BootstrapUtils } from "./bootstraps/utils";
import { read_config } from "./config";
import { clientFlareactConfig } from "./configs/flareact/webpack.client.config";
import { generateWorkerFlareactConfig } from './configs/flareact/webpack.worker.config';
import { generateWorkerStaticSiteConfig } from './configs/static-site/webpack.worker.config';
import { displayError, ErrorCode, errorCode, FailedToBuild } from "./errors";
import ManifestBuilder, { ManifestMap } from "./manifest";

interface KVArgs {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
  path: string;
  retries: number;
}

const CLIENT_CFG_PATH =
  "node_modules/flareact/configs/webpack.client.config.js";
const WORKER_CFG_PATH =
  "node_modules/flareact/configs/webpack.worker.config.js";
const BASIC_CFG_PATH = "webpack.config.js";

export class Builder {
    targetDir: string;

    constructor(targetDir: string) {
        this.targetDir = targetDir;
    }

    static init(): Builder {
        const targetDir = process.cwd();
        try {
            const workerDir = path.join(targetDir, "worker");

            if (fs.existsSync(workerDir)) {
                if (!fs.statSync(workerDir).isDirectory()) {
                    throw new FailedToBuild(
                        targetDir,
                        "cannot create './worker' directory"
                    );
                }
            } else {
                fs.mkdirSync(workerDir);
            }
            return new Builder(targetDir);
        } catch (error: any) {
            throw new FailedToBuild(targetDir, error.message);
        }
    }

    async buildClient(): Promise<webpack.Stats> {
        const baseConfigPath = path.join(this.targetDir, CLIENT_CFG_PATH);
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const baseConfig = require(baseConfigPath)({});
        const config = merge(baseConfig, clientFlareactConfig);

        const clientCompiler = webpack(config);

        return new Promise((resolve, reject) => {
            clientCompiler.run((err: Error, stats: webpack.Stats) => {
                if (err) {
                    const error = err as any;
                    const reason = JSON.stringify(
                        error.details ?? "webpack execution for the client",
                        null,
                        " "
                    );
                    reject(new FailedToBuild(this.targetDir, reason));
                    return;
                }
                const info = stats.toJson();
                if (stats.hasErrors()) {
                    for (const msg of info.errors) {
                        console.error(msg);
                    }
                    reject(
                        new FailedToBuild(this.targetDir, "client compilation errors")
                    );
                    return;
                }
                console.log("Finished client.");
                resolve(stats);
            });
        });
    }

    async buildWorker(
        configPath: string,
        manifest: ManifestMap,
        kvArgs: any,
        isStaticSite: boolean
    ): Promise<webpack.Stats> {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const baseConfig = require(path.join(this.targetDir, configPath));
        const baseConfigObj = typeof baseConfig === "function" ?
            baseConfig() : baseConfig;

        const outputPath = path.join(this.targetDir, "worker");
        const additionalConfig = isStaticSite ?
            generateWorkerStaticSiteConfig(outputPath) : generateWorkerFlareactConfig(outputPath);

        const config = merge(baseConfigObj, additionalConfig);

        const definePluginObj: any = (config.plugins ?? []).filter(
            (el: object) => el.constructor.name === "DefinePlugin"
        )[0];
        definePluginObj.definitions.CREDENTIALS_VALUE = JSON.stringify(kvArgs);
        definePluginObj.definitions.STATIC_CONTENT_MANIFEST_VALUE = JSON.stringify(manifest);

        const workerCompiler = webpack(config);

        let bootstrapCode = BOOTSTRAP_CODE;
        if (isStaticSite) bootstrapCode += ' global.__PROJECT_TYPE_PATTERN = PROJECT_TYPE_PATTERN_VALUE;';

        workerCompiler.hooks.beforeRun.tapAsync(
            "FileManagerPlugin",
            (_, callback) => {
                const bootstrapUtils = new BootstrapUtils(
                    config.entry?.toString() ?? "./index.tmp.js",
                    bootstrapCode
                );
                bootstrapUtils.addBootstrap();
                callback();
            }
        );

        return new Promise((resolve, reject) => {
            workerCompiler.run((err: Error, stats: webpack.Stats) => {
                if (err) {
                    const error = err as any;
                    const reason = JSON.stringify(
                        error.details ?? "webpack execution for the worker",
                        null,
                        " "
                    );
                    reject(new FailedToBuild(this.targetDir, reason));
                    return;
                }
                const info = stats.toJson();
                if (stats.hasErrors()) {
                    for (const msg of info.errors) {
                        console.error(msg);
                    }
                    reject(
                        new FailedToBuild(this.targetDir, "worker compilation errors")
                    );
                    return;
                }
                console.log("Finished worker.");
                resolve(stats);
            });
        });
    }

    generateManifest(subdir = "out"): any {
        const manifestBuilder = new ManifestBuilder(this.targetDir, subdir);
        const manifest = manifestBuilder.storageManifest();
        return manifest;
    }

    static async exec(options: any): Promise<ErrorCode> {
        try {
            const rawCfg = read_config(options);
            const cfg = await AssetPublisher.getConfig(rawCfg, process.env);
            const kvArgs: KVArgs = Object.assign({ retries: 0 }, cfg.kv);

            const builder = await Builder.init();

            let webpackConfigPath = BASIC_CFG_PATH;
            if (!options.staticSite) {
                await builder.buildClient();
                webpackConfigPath = WORKER_CFG_PATH;
            }
            const manifest = builder.generateManifest(options.assetsDir);
            await builder.buildWorker(
                webpackConfigPath,
                manifest,
                kvArgs,
                options.staticSite
            );

            console.log("Completed.");
            return ErrorCode.Ok;
        } catch (err: any) {
            displayError(err);
            return errorCode(err);
        }
    }
}
