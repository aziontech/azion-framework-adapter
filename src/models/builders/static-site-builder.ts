import { Builder } from "./builder";
import { ErrorCode } from '../../errors';

import * as fs from 'fs';
import { build } from 'esbuild';
import { entrypoint } from "../../entrypoint/entrypoints.js";

const ERROR_MESSAGE = "Static Site build not implemented!";

class StaticSiteBuilder extends Builder {
    constructor(targetDir: string) {
        super(targetDir);
    }

    async build(params: any): Promise<ErrorCode> {
        console.log(params);

        throw Error(ERROR_MESSAGE);
    }

    async buildWorker(params: any): Promise<any> {
        console.log(params);
        console.log("Coping entrypoint file");
        fs.mkdirSync('azion',{recursive: true});
        fs.writeFileSync('azion/index.js', entrypoint.defaultEntrypoint)

        console.log("esBuild Function");
        await build({
            entryPoints: ['azion/index.js'],
            bundle: true ,
            define: {
                self: 'globalThis',
                VERSION_ID: JSON.stringify(params.versionId),
                PROJECT_TYPE_PATTERN_VALUE: JSON.stringify("PROJECT_TYPE:STATIC_SITE")
            },
            inject: ['./bootstrap.js'],
            sourcemap: false,
            target: "esnext",
            minify: false,
            outdir: 'azion/worker',
        }).catch((e) => {
            console.log("Error", e)
            process.exit(1)
        }
        );
    }
}

export { StaticSiteBuilder }