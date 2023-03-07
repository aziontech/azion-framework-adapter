import { Builder } from "./builder";
import { displayError, errorCode } from '../../errors';

import path from "path";
import * as fs from 'fs';
import * as esbuild from 'esbuild';

import { ENTRYPOINT, WORKER_DIR } from "../../constants";
import { entrypoint } from "../../entrypoint/entrypoints.js";
import { BootstrapUtils } from "../../bootstraps/utils";

class StaticSiteBuilder extends Builder {
    private entrypointPath: string;
    private outputPath: string;
    private outfile: string;
    constructor(targetDir: string) {
        super(targetDir);
        this.entrypointPath = path.join(this.targetDir,ENTRYPOINT);
        this.outputPath = path.join(this.targetDir,WORKER_DIR);
        this.outfile = path.join(this.outputPath,'function.js');
    }

    async build(params: any): Promise<any> {
        this.createWorkerDir();
        this.createEntrypointFunction();
        await this.buildWorker(params);
    }

    createEntrypointFunction() {
        const bootstrapCode = ' self.__PROJECT_TYPE_PATTERN = PROJECT_TYPE_PATTERN_VALUE;';

        try {
            fs.mkdirSync(this.outputPath,{recursive: true});
            fs.writeFileSync(this.entrypointPath, entrypoint.defaultEntrypoint.toString() );


            const bootstrapUtils = new BootstrapUtils(
                this.entrypointPath,
                bootstrapCode
            );
            bootstrapUtils.addBootstrap();
        } catch(e) {
            displayError(e);
            return errorCode(e);
        }
    }

    async buildWorker(params: any): Promise<any> {
        console.log("Initialising build.");
        await esbuild.build({
            entryPoints: [this.entrypointPath],
            bundle: true ,
            define: {
                self: 'globalThis',
                VERSION_ID: JSON.stringify(params.versionId) || "'undefined'",
                PROJECT_TYPE_PATTERN_VALUE: JSON.stringify("PROJECT_TYPE:STATIC_SITE")
            },
            sourcemap: false,
            target: "es2021",
            platform: "neutral",
            minify: false,
            outfile: this.outfile
        }).catch((e) => {
            console.log("Error", e)
            process.exit(1)
        }
        ).finally(() => {
            fs.rmSync(this.entrypointPath,{recursive: true});
        });
    }
}

export { StaticSiteBuilder }