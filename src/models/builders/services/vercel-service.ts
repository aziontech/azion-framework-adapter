import { CannotWriteFile, VercelProjectError, VercelLoadConfigError} from "./errors/error";
import { mkdirSync, readFileSync, writeFileSync, existsSync} from "fs";
import { dirname, join, relative, resolve } from "path";
import glob from "fast-glob";
import { tmpdir } from "os";

import util = require('node:util');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const exec = util.promisify(require('node:child_process').exec);

export class VercelService {
    tmpFunctionsDir: string = join(tmpdir(), Math.random().toString(36).slice(2));

    createVercelProjectConfig() {
        console.log("Creating project config file ...");
    
        try {
            const projectConfigDir = '.vercel';
            const projectConfigFilePath = `${projectConfigDir}/project.json`;
    
            if (!existsSync(projectConfigFilePath)) {
                if (!existsSync(projectConfigDir)) {
                    mkdirSync(projectConfigDir);
                }
    
                writeFileSync(projectConfigFilePath,'{"projectId":"_","orgId":"_","settings":{}}');
            }
        } catch (error:any) {
            throw new CannotWriteFile(error.message);
        }
    }

    async runVercelBuild() {
        // https://vercel.com/docs/build-output-api/v3
        console.log("Running initial build ...");

        try {
            await exec('npx --yes vercel@28.16.11 build --prod');
        } catch (error:any) {
            throw new VercelProjectError(error.message);
        }
    }

    loadVercelConfigs(): any {
        console.log("Loading configs ...")

        try {
            const fileContent = readFileSync(".vercel/output/config.json", "utf8");
            const config = JSON.parse(fileContent);

            return config;
        } catch (error:any) {
            throw new VercelLoadConfigError(error.message);
        }
    }

    // function to walk in builded functions dir, detect invalid functions and adapt content
    adapt() {
        try{
            // eslint-disable-next-line prefer-const
            let functionsMap: Map<string, string> = new Map();
            const vcConfigPaths: Array<string> = glob.sync(".vercel/output/functions/**/.vc-config.json");
            const vcConfigObjects:Array<any> = vcConfigPaths.map(file => {
                return {
                    path: file,
                    content: JSON.parse(readFileSync(file, "utf8")),
                }
            });
            const validVcObjects:Array<any> = vcConfigObjects.filter(vcConfig =>  this.isVcConfigValid(vcConfig.content));
            const invalidVcObjects:Array<any> = vcConfigObjects.filter(vcConfig => !this.isVcConfigValid(vcConfig.content));
            if (invalidVcObjects.length > 0) {
                let invalidObjectsErrorMessage = "\nInvalid objects:\n"; 
                invalidVcObjects.map(item=>{
                    const pathName = dirname(item.path).split('/');
                    invalidObjectsErrorMessage +=` ${pathName[pathName.length-1]} invalid runtime: ${item.content.runtime}\n`;
                });
                throw new Error(invalidObjectsErrorMessage);
            }
            const vcEntrypoints:Array<any> = validVcObjects.map(vcObject => {
                const path = vcObject.path.replace("/.vc-config.json","");
                const codePath = join(dirname(vcObject.path).replace("/.vc-config.json",""), vcObject.content.entrypoint);
                const codeTmpDir = join(this.tmpFunctionsDir,vcObject.path).replace("/.vc-config.json","")
                return {
                    path:path,
                    codeTmpDir: codeTmpDir,
                    code: readFileSync(codePath,"utf8").replace(/Object.defineProperty\(globalThis,\s*"__import_unsupported",\s*{[^}]*}\)/gm,"true")
                };
            });
            vcEntrypoints.forEach(item=>{
                const functionsDir = resolve(".vercel/output/functions");
                const relativePath = relative(functionsDir, item.path);
                const newFilePath = join(this.tmpFunctionsDir, `${relativePath}.js`);
                mkdirSync(dirname(newFilePath),{recursive:true});
                writeFileSync(newFilePath,item.code,"utf8");
                functionsMap.set(
                    relative(functionsDir,item.path).slice(0, -".func".length),
                    newFilePath
                );
            });
            return functionsMap;
        }catch(error:any){
            throw new Error(error.message);
        }
    }
    
    private isVcConfigValid(vcConfig:any):boolean{
        return (vcConfig.runtime === "edge") && (vcConfig.entrypoint !== undefined);
    }
}