/* eslint-disable prefer-const */
import * as glob from "fast-glob";
import * as child_process from 'child_process';
import * as chai from 'chai';
import * as fs from 'fs';

import { VercelService } from '../../../../../dist/models/builders/services/vercel-service';
import { basename } from "path";

const { expect } = chai;


describe('Vercel Service', () => {
    afterEach(()=>{
        chai.spy.restore();
    });
    
    describe('method runVercelBuild',()=>{
        it('should throw an error when execSync fail to execute a command',()=>{
            const vercelSerivice = new VercelService();
            chai.spy.on(child_process,'execSync',()=>{
                throw new Error('faild to exec vercel build');
            });

            expect(()=>{vercelSerivice.runVercelBuild()}).to.throw('faild to exec vercel build');
        });
    });

    describe('method loadVercelConfigs',()=>{
        
        it('should throw an error when readfilesync fails',()=>{
            const vercelSerivice = new VercelService();
            chai.spy.on(fs, "readFileSync", () => { throw new Error('failed while trying to read file') });

            expect(()=>vercelSerivice.loadVercelConfigs()).to.throw('failed while trying to read file');
        });

        it('should throw an error when JSON parse fails',()=>{
            const vercelSerivice = new VercelService();
            chai.spy.on(fs, "readFileSync", () => { return '{"runtime":"node", "entrypoint":"index.js"}'; });
            chai.spy.on(JSON,"parse",()=>{throw new Error('failed while trying to parse data')});

            expect(()=>vercelSerivice.loadVercelConfigs()).to.throw('failed while trying to parse data');
        });
    });

    describe('method createVercelProjectConfig',()=>{

        it('should return an error if mkdirSync fails',()=>{
            const vercelSerivice = new VercelService();
            chai.spy.on(fs,'existsSync',()=>{return false});
            chai.spy.on(fs,'mkdirSync',()=>{
                throw new Error('fail to create a directory');
            });

            expect(()=>vercelSerivice.createVercelProjectConfig()).to.throw('fail to create a directory');

        });

        it('should return an error if writeFileSync fails',()=>{
            const vercelSerivice = new VercelService();
            chai.spy.on(fs,'existsSync',()=>{return false});
            chai.spy.on(fs,'mkdirSync',()=>{return undefined});
            chai.spy.on(fs,'writeFileSync',()=>{throw new Error('failed while trying to write file')});

            expect(()=>vercelSerivice.createVercelProjectConfig()).to.throw('failed while trying to write file');
        });
    });

    describe('method adapt',()=>{

        it('should pass if a valid object was returned by the glob.sync method',()=>{
            const vercelService = new VercelService();
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

            const functionsMap = vercelService.adapt();
            expect(functionsMap).to.be.instanceOf(Map<string,string>);

            const tempFilePathA = functionsMap.get('a');
            expect(tempFilePathA).to.not.equal(undefined);
            expect(basename(`${tempFilePathA}`)).to.equal('a.func.js');

            const tempFilePathB = functionsMap.get('b');
            expect(tempFilePathB).to.not.equal(undefined);
            expect(basename(`${tempFilePathB}`)).to.equal('b.func.js');
    
        });


        it('should raise invalid objects if a vc-config::entrypoint was undefined',()=>{
            const vercelService = new VercelService();
            chai.spy.on(glob,"sync",()=>{
                return [ 
                    ".vercel/output/functions/a.func/.vc-config.json", 
                    ".vercel/output/functions/b.func/.vc-config.json"
                ]
            });
            const expectedErrorMessage = "This project is not an edge project\nMake sure that next.config.js file are using 'runtime: experimental-edge'";
            chai.spy.on(fs,"readFileSync", () => { return '{"runtime":"edge"}'; });
            
            expect(()=>vercelService.adapt()).to.throw(expectedErrorMessage);
        });

        it('should raise invalid objects if a vc-config::runtime is different to edge',()=>{
            const vercelService = new VercelService();
            const vcConfig:any = {
                '.vercel/output/functions/a.func/.vc-config.json':'{"runtime":"node", "entrypoint":"index.js"}', 
                '.vercel/output/functions/b.func/.vc-config.json':'{"runtime":"edge", "entrypoint":"index.js"}'

            }
            chai.spy.on(glob,"sync",()=>{
                return [ 
                    ".vercel/output/functions/a.func/.vc-config.json", 
                    ".vercel/output/functions/b.func/.vc-config.json"
                ]
            });
            const expectedErrorMessage = "This project is not an edge project\nMake sure that next.config.js file are using 'runtime: experimental-edge'";
            chai.spy.on(fs, "readFileSync", (path:string) => {
                return vcConfig[path]; 
            });

            expect(()=> vercelService.adapt()).to.throw(expectedErrorMessage);
        });

        it('should raise an error if .vc-config path doesnt exists',()=>{
            const vercelService = new VercelService();
            chai.spy.on(glob,"sync",()=>{
                throw new Error(".vc-config.json not found");
            });
            expect(()=>vercelService.adapt()).to.throw(".vc-config.json not found");
        });
    });
});