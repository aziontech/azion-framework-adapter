/* eslint-disable prefer-const */
import * as path from 'path';
import * as chai from 'chai';
import * as fs from 'fs';
import * as esbuild from "esbuild";

import { NextjsBuilder } from '../../../../dist/models/builders/nextjs-builder';
import * as vcService from '../../../../dist/models/builders/services/vercel-service';
import { ManifestBuilderService } from '../../../../dist/models/builders/services/manifest-builder-service';

const { expect } = chai;


describe('NexjsBuilder',()=>{

    afterEach(()=>{
        chai.spy.restore();
    });

    describe('method build',()=>{

        it('should throw an error if vercelService.createVercelProjectConfig fails',async()=>{
            const vercelService = {
                ...vcService,
                createVercelProjectConfig:()=>{throw new Error('failed while trying to create vercel project config');}

            };
            const nextjsBuilder = new NextjsBuilder('/fake/path');
            nextjsBuilder.vercelService = vercelService;

            const error = await (async()=>{
                try{
                    await nextjsBuilder.build({versionId:'fake-id'});
                }catch(error:any){
                    return error;
                }
            })();
                    
            expect(error.message).to.equal('failed while trying to create vercel project config');
        });

        it('should throw an error if vercelService.runVercelBuild() fail',async ()=>{
            const vercelService = {
                ...vcService,
                createVercelProjectConfig:()=>{return true;},
                runVercelBuild:()=>{throw new Error('failed while trying to run vercel build');}

            };
            const nextjsBuilder = new NextjsBuilder('/fake/path');
            nextjsBuilder.vercelService = vercelService;

            const error = await (async()=>{
                try{
                    await nextjsBuilder.build({versionId:'fakeId'});
                }catch(error:any){
                    return error;
                }
                
            })();

            expect(error.message).to.equals('failed while trying to run vercel build');
        });

        it('should throw en error if vercelService.loadVercelConfigs fails',async()=>{
            const vercelService = {
                ...vcService,
                createVercelProjectConfig:()=>{return true;},
                runVercelBuild:()=>{return true;},
                loadVercelConfigs:()=>{throw new Error('fail while trying to run loadVercelConfigs');}

            };

            const nextjsBuilder = new NextjsBuilder('/fake/path');
            nextjsBuilder.vercelService = vercelService;
            const error = await (async()=>{
                try{
                    await nextjsBuilder.build({versionId:'fakeId'});
                }catch(error:any){
                    return error;
                }
            })();

            expect(error.message).to.equal('fail while trying to run loadVercelConfigs');
        });

        it('should throw an error if vercelService.adapt fails',async ()=>{
            const vercelService = {
                ...vcService,
                createVercelProjectConfig:()=>{return true;},
                runVercelBuild:()=>{return true;},
                loadVercelConfigs:()=>{return true;},
                detectBuildedFunctions:()=>{return 'true'},
                adapt:()=>{throw new Error('failed while trying to adapt files');}

            };
            chai.spy.on(fs,'statSync',()=>{
                return true;
            });

            const nextjsBuilder = new NextjsBuilder('/fake/path');
            nextjsBuilder.vercelService = vercelService;
            const error = await (async()=>{
                try{
                    await nextjsBuilder.build({versionId:'fakeId'});
                }catch(error:any){
                    return error;
                }
            })();
            
            expect(error.message).to.equal('failed while trying to adapt files');
        });
        
        it('should throw an error if ManifestBuilder.assetsPaths fails',async()=>{
            const vercelService = {
                ...vcService,
                createVercelProjectConfig:()=>{return true;},
                runVercelBuild:()=>{return true;},
                loadVercelConfigs:()=>{return true;},
                detectBuildedFunctions:()=>{return 'true'},
                adapt:async()=>{return}

            };
            const manifestBuilderService = new ManifestBuilderService();

            chai.spy.on(manifestBuilderService,'assetsPaths',()=>{
                throw new Error('manifest builder service error');
            });
            chai.spy.on(fs,'statSync',()=>{
                return 'true';
            });
 
            chai.spy.on(path,'join',()=>{
                return 'true';
            });


            const nextjsBuilder = new NextjsBuilder('/fake/path');
            nextjsBuilder.manifestBuilderService = manifestBuilderService;
            nextjsBuilder.vercelService = vercelService;
            chai.spy.on(nextjsBuilder,'handleMiddleware',()=>{
                return true;
            });

            const error = await (async()=>{
                try{
                    await nextjsBuilder.build({versionId:'fakeId'});
                }catch(error:any){
                    return error;
                }
            })();

            expect(error.message).to.equal('No functions was provided');
        });

        it('should build project with success',async()=>{
            const manifestBuilderService = new ManifestBuilderService();
            const vercelService = {
                ...vcService,
                createVercelProjectConfig:()=>{return true;},
                runVercelBuild:()=>{return true;},
                loadVercelConfigs:()=>{return true;},
                detectBuildedFunctions:()=>{return 'true'},
                adapt:async()=>{return}

            };
            
            chai.spy.on(esbuild,'build',()=>{true});
            chai.spy.on(manifestBuilderService,'assetsPaths',()=>{
                return true;
            });
            chai.spy.on(fs,'statSync',()=>{
                return true;
            });

            const nextjsBuilder = new NextjsBuilder('/fake/path');
            nextjsBuilder.manifestBuilderService = manifestBuilderService;
            nextjsBuilder.vercelService = vercelService;

            expect(async()=>await nextjsBuilder.build({versionId:'fakeId'})).to.not.throw();
        });
        
    });
});
