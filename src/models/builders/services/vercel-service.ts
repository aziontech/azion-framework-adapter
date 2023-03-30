//import { readFile, writeFile, mkdir } from "fs/promises";
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import glob from "fast-glob";
import { tmpdir } from "os";


export class VercelService {
    tmpFunctionsDir: string = join(tmpdir(), Math.random().toString(36).slice(2));
    functionsMap: Map<string, string> = new Map();
    invalidFunctions: string[] = [];
    functionsEntries: any;

    // .vercel/output/functions/a/.vc-config.json
    // .vercel/output/functions/b/.vc-config.json
    // readFileSync(".vercel/output/functions/b/.vc-config.json")
    /*
        {
            fs_1:{
                readFileSync:(path)=>{
                    HashMap<string,string> fakeFiles = {
                        ".vercel/output/functions/a/.vc-config.json": "{runtime:node, entrypoint: index.js}"
                        ".vercel/output/functions/b/.vc-config.json": "{runtime:edge, entrypoint: index.js}"
                    };
                    return fakeFile[path];
                }
            }
        }
    */ 
    /*
   {
    "operationType": "API",
    "handler": "___next_launcher.cjs",
    "runtime": "nodejs18.x",
    "environment": {},
    "supportsMultiPayloads": false,
    "framework": {
        "slug": "nextjs",
        "version": "13.2.4"
    },
    "launcherType": "Nodejs",
    "shouldAddHelpers": false,
    "shouldAddSourcemapSupport": false
    }
   */
    // alternative B
    // mockLoadConfig() {
    // return ["{runtime:node, entrypoint: index.js}", "{runtime:edge, entrypoint: index.js}"];
    // }
    // loadConfig() {
    // const vcConfigPaths: Array<string> = await glob(".vercel/output/functions/**/.vc-config.json");
    // const vcConfigRaw:Array<string> = vcConfigPaths.map(file =>readFileSync(file, "utf8"));
    // return vcConfigRaw;
    // }
    // loadConfig().map(Parse)
    
    /*
        JSON:{
            parse:(param)=>{
                return param
            }
        }
    */

    // function to walk in builded functions dir, detect invalid functions and adapt content
    async adapt() {
        const vcConfigPaths: Array<string> = await glob(".vercel/output/functions/**/.vc-config.json");
        const vcConfigObjects:Array<any> = vcConfigPaths.map(file =>
            [
                JSON.parse(readFileSync(file, "utf8")),
                file.replace(".vc-config.json","index.js")
            ]
        );
        const validVcObjects:Array<any> = vcConfigObjects.filter(vcConfig =>  this.isVcConfigValid(vcConfig[0]));
        const invalidVcObjects:Array<any> = vcConfigObjects.filter(vcConfig => !this.isVcConfigValid(vcConfig[0]));
        if (invalidVcObjects.length > 0) {
            console.log("invalidVcObjects:", ...invalidVcObjects);
            throw new Error("invalid objects");
        }
        const vcEntrypoints:Array<any> = validVcObjects.map(vcObject => {
            return [
                vcObject[1],
                this.readFileWrapper(vcObject[1])
                    .replace(/Object.defineProperty\(globalThis,\s*"__import_unsupported",\s*{[^}]*}\)/gm,"true")
            ];
        }
        );
        vcEntrypoints.map(entrypoint=>{
            mkdirSync(dirname(entrypoint[0]),{recursive:true});
            writeFileSync(entrypoint[0],entrypoint[1])
        });
    }
    
    private readFileWrapper(entrypoint: string): string{
        console.log(`--readFileWrapper-->${entrypoint}`);
        return readFileSync(entrypoint,"utf8");
    }
    /*
    const newFilePath = join(this.tmpFunctionsDir, `${relativePath}.js`);
    await mkdir(dirname(newFilePath), { recursive: true });
    await writeFile(newFilePath, contents);

    this.functionsMap.set(
        relative(functionsDir, filepath).slice(0, -".func".length),
        newFilePath
    );
    */
    private isVcConfigValid(vcConfig:any):boolean{
        return (vcConfig.runtime === "edge") && (vcConfig.entrypoint !== undefined);
    }
    
}