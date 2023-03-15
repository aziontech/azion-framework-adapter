import { Builder } from "./builder";
import { join,  dirname } from "path";
import * as esbuild from 'esbuild';

import { WORKER_DIR } from "../../constants";

class StaticSiteBuilder extends Builder {
    private outputPath: string;
    private outfile: string;
    private dirname: string = dirname(__filename);
    constructor(targetDir: string) {
        super(targetDir);
        this.outputPath = join(this.targetDir,WORKER_DIR);
        this.outfile = join(this.outputPath,'function.js');
    }

    async build(params: any): Promise<any> {
        this.createWorkerDir();
        await this.buildWorker(params);
    }

    async buildWorker(params: any): Promise<any> {
        console.log("Initialising build.");
        await esbuild.build({
            entryPoints: [join(this.dirname, '../../entrypoint/entrypoints-2.js')],
            bundle: true ,
            define: {
                self: 'globalThis',
                VERSION_ID: JSON.stringify(params.versionId) || "'undefined'",
                PROJECT_TYPE_PATTERN_VALUE: JSON.stringify("PROJECT_TYPE:STATIC_SITE")
            },
            sourcemap: false,
            target: "es2021",
            platform: "neutral",
            minify: true,
            outfile: this.outfile
        }).catch((e) => {
            console.log("Error", e)
            process.exit(1)
        }
        );
    }
}

export { StaticSiteBuilder }