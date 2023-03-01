import { Builder } from "./builder";
import { displayError, errorCode } from '../../errors';

import * as fs from 'fs';
import { build } from 'esbuild';
import { entrypoint } from "../../entrypoint/entrypoints.js";

import { spawn } from "child_process";

class StaticSiteBuilder extends Builder {
    constructor(targetDir: string) {
        super(targetDir);
    }

    async build(_params: any): Promise<any> {

        const outputLogs = (data: any) => {
            const lines: string[] = data.toString().split("\n");
            lines.map((line) => {
                if (line.length > 0) console.log(`▲ ${line}`);
            });
        };

        const nextBuild = spawn("npx", ["next", "build"]);

        nextBuild.stdout.on("data", (data) => outputLogs(data));

        nextBuild.stderr.on("data", (data) => outputLogs(data));

        await new Promise((resolve, reject) => {
            nextBuild.on("close", (code) => {
                if (code === 0) {
                    resolve(null);
                } else {
                    reject();
                }
            });
        });

        const nextExport = spawn("npx", ["next", "export"]);

        nextExport.stdout.on("data", (data) => outputLogs(data));

        nextExport.stderr.on("data", (data) => outputLogs(data));

        await new Promise((resolve, reject) => {
            nextExport.on("close", (code) => {
                if (code === 0) {
                    resolve(null);
                } else {
                    reject();
                }
            });
        });
    }

    async buildWorker(params: any): Promise<any> {
        try {
            fs.mkdirSync('azion/worker',{recursive: true});
            fs.writeFileSync('azion/index.js', entrypoint.defaultEntrypoint);
        } catch(e) {
            displayError(e);
            return errorCode(e);
        }

        console.log("Initialising build.");
        await build({
            entryPoints: ['azion/index.js'],
            bundle: true ,
            define: {
                self: 'globalThis',
                VERSION_ID: JSON.stringify(params.versionId)
            },
            sourcemap: false,
            target: "esnext",
            minify: false,
            outfile: 'azion/worker/function.js'
        }).catch((e) => {
            console.log("Error", e)
            process.exit(1)
        }
        );
    }
}

export { StaticSiteBuilder }