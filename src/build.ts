import * as fs from 'fs';
import path from 'path';
import process from 'process';
import webpack from 'webpack';
import merge from "webpack-merge";

import { initCellsTemplate } from './init';
import { AssetPublisher } from './asset-publisher';
import { BOOTSTRAP_CODE } from "./bootstraps/common";
import { BootstrapUtils } from "./bootstraps/utils";
import { read_config } from "./config";
import { clientFlareactConfig } from "./configs/flareact/webpack.client.config";
import { generateWorkerFlareactConfig } from './configs/flareact/webpack.worker.config';
import { generateWorkerStaticSiteConfig } from './configs/static-site/webpack.worker.config';
import { displayError, ErrorCode, errorCode, FailedToBuild } from "./errors";
import ManifestBuilder, { ManifestMap } from "./manifest";
import { VersionChecker } from './utils/version-checker/version-checker';

import { CELLS_SITE_TEMPLATE_REPO, CELLS_SITE_TEMPLATE_WORK_DIR } from './constants';

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

    createWorkerDir() {
        const workerDir = path.join(this.targetDir, "worker");

        if (fs.existsSync(workerDir)) {
            if (!fs.statSync(workerDir).isDirectory()) {
                throw new FailedToBuild(
                    workerDir,
                    "cannot create 'worker' directory"
                );
            }
        } else {
            fs.mkdirSync(workerDir);
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
            "Before compile",
            (_, callback) => {

                fs.copyFileSync(isStaticSite? "./src/index.js": "./index.js", config.entry);

                const bootstrapUtils = new BootstrapUtils(
                    config.entry?.toString() ?? "./index.tmp.js",
                    bootstrapCode
                );
                bootstrapUtils.addBootstrap();
                callback();
            }
        );

        workerCompiler.hooks.done.tapAsync(
            "After compile",
            (_, callback) => {
                fs.rmSync(config.entry);
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

    static async exec(options: any): Promise<ErrorCode> {
        try {

            const targetDir = process.cwd();
            VersionChecker.nextjs_version(targetDir);

            const rawCfg = read_config(options);
            const cfg = await AssetPublisher.getConfig(rawCfg, process.env);
            const kvArgs: KVArgs = Object.assign({ retries: 0 }, cfg.kv);

            let builder;
            let manifest;

            let webpackConfigPath = BASIC_CFG_PATH;
            if (options.staticSite) {
                await initCellsTemplate(targetDir, CELLS_SITE_TEMPLATE_REPO);
                const staticSiteWorkerDir = path.join(targetDir, CELLS_SITE_TEMPLATE_WORK_DIR);
                console.log("Static site template initialized. Building ...");
                process.chdir(staticSiteWorkerDir);
                builder = new Builder(process.cwd());
                builder.createWorkerDir();
                manifest = new ManifestBuilder(targetDir, options.assetsDir, `${CELLS_SITE_TEMPLATE_WORK_DIR}/worker/manifest.json`).storageManifest();
            } else {
                builder = new Builder(targetDir);
                builder.createWorkerDir();
                await builder.buildClient();
                manifest = new ManifestBuilder(targetDir).storageManifest();
                webpackConfigPath = WORKER_CFG_PATH;
            }

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

