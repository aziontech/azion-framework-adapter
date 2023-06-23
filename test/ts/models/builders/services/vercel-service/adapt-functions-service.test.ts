import * as glob from "fast-glob";
import { basename } from "path";
import * as chai from 'chai';
import * as fs from 'fs';


import type { PrerenderedFileData, WasmModuleInfo} from '../../../../../../dist/models/builders/services/types/vercel-service-types';
import * as vcService from '../../../../../../dist/models/builders/services/vercel-service';

const { expect } = chai;
const fakeParams = {
    invalidFunctions: new Set<string>(),
    functionsMap: new Map<string, string>(),
    webpackChunks: new Map<number, string>(),
    wasmIdentifiers: new Map<string, WasmModuleInfo>(),
    prerenderedRoutes: new Map<string, PrerenderedFileData>()
}


describe.only('method adapt',()=>{
    afterEach(()=>{
        chai.spy.restore();
    });

    it('adapt function should be called with success',async()=>{
        const vercelService = vcService;
        chai.spy.on(glob,"sync",()=>{
            return [ 
                ".vercel/output/functions/a.func/.vc-config.json", 
                ".vercel/output/functions/b.func/.vc-config.json"
            ]
        });
        chai.spy.on(fs,"readFileSync", () => {
            return '{"runtime":"edge", "entrypoint":"index.js"}';
        });
        chai.spy.on(fs,"writeFileSync",() => {return true});
        chai.spy.on(fs,"mkdirSync",() => {return undefined});
        chai.spy.on(fs,"readdirSync",()=>{return ['fake/paths','fake/paths2']})
        const result = await (async()=>{
            try{
                await vercelService.adapt(fakeParams,'fake/path')
                return 'ok';
            }catch(error:any){
                return error.message;
            }
        })();

        expect(result).to.equal('ok');
    });


    it('should raise invalid objects if a vc-config::entrypoint was undefined',async()=>{
        const vercelService = vcService;
        chai.spy.on(glob,"sync",()=>{
            return [ 
                ".vercel/output/functions/fakeFileA.func/.vc-config.json", 
                ".vercel/output/functions/fakeFileB.func/.vc-config.json"
            ]
        });
        const expectedErrorMessage = 'This project is not an edge project'
        chai.spy.on(fs,"readFileSync", () => { return '{"runtime":"edge"}'; });
        const result = await (async()=>{
            try{
                await vercelService.adapt(fakeParams,'')
                return 'ok';
            }catch(error:any){
                return error.message;
            }
        })();
        expect(result.includes(expectedErrorMessage)).to.be.true;
    });

    it('should raise invalid objects if a vc-config::runtime is different to edge',async()=>{
        const vercelService = vcService;
        const vcConfig:any = {
            '.vercel/output/functions/fakeFileA.func/.vc-config.json':'{"runtime":"node", "entrypoint":"index.js"}', 
            '.vercel/output/functions/fakeFileB.func/.vc-config.json':'{"runtime":"edge", "entrypoint":"index.js"}',
            '.vercel/output/functions/fakeFileC.func/.vc-config.json':'{"runtime":"node", "entrypoint":"index.js"}',
            '.vercel/output/functions/fakeFileD.func/.vc-config.json':'{"runtime":"node", "entrypoint":"index.js"}', 

        }
        chai.spy.on(glob,"sync",()=>{
            return [
                ".vercel/output/functions/fakeFileA.func/.vc-config.json", 
                ".vercel/output/functions/fakeFileB.func/.vc-config.json",
                ".vercel/output/functions/fakeFileC.func/.vc-config.json",
                ".vercel/output/functions/fakeFileD.func/.vc-config.json"
            ]
        });

        chai.spy.on(fs, "readFileSync", (path:string) => {
            return vcConfig[path]; 
        });
        const result = await (async()=>{
            try{
                await vercelService.adapt(fakeParams,'fakeDir')
                return 'ok';
            }catch(error:any){
                return error.message;
            }
        })();
        expect(result.includes('fakeFileA')).to.be.true;
        expect(result.includes('fakeFileC')).to.be.true;
        expect(result.includes('fakeFileD')).to.be.true;
    });

    // it('should raise an error if .vc-config path doesnt exists',()=>{
    //     const vercelService = vcService;
    //     chai.spy.on(glob,"sync",()=>{
    //         throw new Error(".vc-config.json not found");
    //     });
    //     expect(()=>vercelService.adapt(fakeParams,'')).to.throw(".vc-config.json not found");
    // });
});