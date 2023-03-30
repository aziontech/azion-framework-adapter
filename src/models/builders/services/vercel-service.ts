//import { readFile, writeFile, mkdir } from "fs/promises";
import { readFileSync } from "fs";
import { join } from "path";
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
        const vcConfigObjects:Array<any> = vcConfigPaths.map(file =>JSON.parse(readFileSync(file, "utf8")));
        const validVcObjects = vcConfigObjects.filter(vcConfig =>  this.isVcConfigValid(vcConfig));
        const invalidVcObjects = vcConfigObjects.filter(vcConfig => !this.isVcConfigValid(vcConfig));
        if (invalidVcObjects.length > 0) {
            console.log("invalidVcObjects:", ...invalidVcObjects);
            throw new Error("invalid objects");
        }
        validVcObjects.map(vcObject => {
            const code = readFileSync(vcObject.entrypoint, "utf8").replace(
                /Object.defineProperty\(globalThis,\s*"__import_unsupported",\s*{[^}]*}\)/gm,
                "true"
            );
            return code;
            /*
            const newFilePath = join(this.tmpFunctionsDir, `${relativePath}.js`);
            await mkdir(dirname(newFilePath), { recursive: true });
            await writeFile(newFilePath, contents);

            this.functionsMap.set(
                relative(functionsDir, filepath).slice(0, -".func".length),
                newFilePath
            );
            */
        });
    }
    
    private isVcConfigValid(vcConfig:any):boolean{
        return vcConfig.runtime === "edge" && vcConfig.entrypoint !== undefined;
    }
    
}