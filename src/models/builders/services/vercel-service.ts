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
    functionsMap: Map<string, string> = new Map();

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
        } catch (error) {
            throw new VercelLoadConfigError(`${error}`);
        }
    }

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
        const vcConfigObjects:Array<any> = vcConfigPaths.map(file => {
            return {
                path: file,
                content: JSON.parse(readFileSync(file, "utf8")),
            }
        });
        const validVcObjects:Array<any> = vcConfigObjects.filter(vcConfig =>  this.isVcConfigValid(vcConfig.content));
        const invalidVcObjects:Array<any> = vcConfigObjects.filter(vcConfig => !this.isVcConfigValid(vcConfig.content));
        if (invalidVcObjects.length > 0) {
            console.log("invalidVcObjects:", ...invalidVcObjects);
            throw new Error("invalid objects");
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
            this.functionsMap.set(
                relative(functionsDir,item.path).slice(0, -".func".length),
                newFilePath
            );
        });
    }
    
    // private writeVcEntrypoints(content: Array<any>){
    //     content.forEach(item=>{

    //     });
    // }

    private isVcConfigValid(vcConfig:any):boolean{
        return (vcConfig.runtime === "edge") && (vcConfig.entrypoint !== undefined);
    }
    



    
    /*
    [
  '.vercel/output/functions/[...slug].func/.vc-config.json',
  '.vercel/output/functions/account.func/.vc-config.json',
  '.vercel/output/functions/login.func/.vc-config.json',
  '.vercel/output/functions/index.func/.vc-config.json',
  '.vercel/output/functions/checkout.func/.vc-config.json',
  '.vercel/output/functions/s.func/.vc-config.json',
  '.vercel/output/functions/[slug]/p.func/.vc-config.json',
  '.vercel/output/functions/api/graphql.func/.vc-config.json',
  '.vercel/output/functions/api/preview.func/.vc-config.json',
  '.vercel/output/functions/api/health/live.func/.vc-config.json',
  '.vercel/output/functions/api/health/ready.func/.vc-config.json'
    ]
    =------------------------
    {
    tmpFunctionsDir: '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/sq8jc1e0bk',
    relativePath: 'account.func'
    }
    {
    tmpFunctionsDir: '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/sq8jc1e0bk',
    relativePath: 'login.func'
    }
    {
    tmpFunctionsDir: '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/sq8jc1e0bk',
    relativePath: 'checkout.func'
    }
    {
    tmpFunctionsDir: '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/sq8jc1e0bk',
    relativePath: 'index.func'
    }
    {
    tmpFunctionsDir: '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/sq8jc1e0bk',
    relativePath: 'api/preview.func'
    }
    {
    tmpFunctionsDir: '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/sq8jc1e0bk',
    relativePath: 's.func'
    }
    */
}

/*
    log map

    ---functions-map----> Map(2) {
  'api/preview' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/api/preview.func.js',
  'account' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/account.func.js'
} <-----
---functions-map----> Map(3) {
  'api/preview' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/api/preview.func.js',
  'account' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/account.func.js',
  'checkout' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/checkout.func.js'
} <-----
---functions-map----> Map(4) {
  'api/preview' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/api/preview.func.js',
  'account' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/account.func.js',
  'checkout' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/checkout.func.js',
  'login' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/login.func.js'
} <-----
---functions-map----> Map(5) {
  'api/preview' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/api/preview.func.js',
  'account' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/account.func.js',
  'checkout' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/checkout.func.js',
  'login' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/login.func.js',
  'api/health/live' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/api/health/live.func.js'
} <-----
---functions-map----> Map(6) {
  'api/preview' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/api/preview.func.js',
  'account' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/account.func.js',
  'checkout' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/checkout.func.js',
  'login' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/login.func.js',
  'api/health/live' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/api/health/live.func.js',
  'index' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/index.func.js'
} <-----
---functions-map----> Map(7) {
  'api/preview' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/api/preview.func.js',
  'account' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/account.func.js',
  'checkout' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/checkout.func.js',
  'login' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/login.func.js',
  'api/health/live' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/api/health/live.func.js',
  'index' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/index.func.js',
  'api/health/ready' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/api/health/ready.func.js'
} <-----
---functions-map----> Map(8) {
  'api/preview' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/api/preview.func.js',
  'account' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/account.func.js',
  'checkout' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/checkout.func.js',
  'login' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/login.func.js',
  'api/health/live' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/api/health/live.func.js',
  'index' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/index.func.js',
  'api/health/ready' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/api/health/ready.func.js',
  's' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/s.func.js'
} <-----
---functions-map----> Map(9) {
  'api/preview' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/api/preview.func.js',
  'account' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/account.func.js',
  'checkout' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/checkout.func.js',
  'login' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/login.func.js',
  'api/health/live' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/api/health/live.func.js',
  'index' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/index.func.js',
  'api/health/ready' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/api/health/ready.func.js',
  's' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/s.func.js',
  'api/graphql' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/api/graphql.func.js'
} <-----
---functions-map----> Map(10) {
  'api/preview' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/api/preview.func.js',
  'account' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/account.func.js',
  'checkout' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/checkout.func.js',
  'login' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/login.func.js',
  'api/health/live' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/api/health/live.func.js',
  'index' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/index.func.js',
  'api/health/ready' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/api/health/ready.func.js',
  's' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/s.func.js',
  'api/graphql' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/api/graphql.func.js',
  '[...slug]' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/[...slug].func.js'
} <-----
---functions-map----> Map(11) {
  'api/preview' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/api/preview.func.js',
  'account' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/account.func.js',
  'checkout' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/checkout.func.js',
  'login' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/login.func.js',
  'api/health/live' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/api/health/live.func.js',
  'index' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/index.func.js',
  'api/health/ready' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/api/health/ready.func.js',
  's' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/s.func.js',
  'api/graphql' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/api/graphql.func.js',
  '[...slug]' => '/var/folders/nj/tdfw4s757817ptm19bcw877c0000gs/T/fc1tgyzry6t/[...slug].func.js',
  '[slug]


*/