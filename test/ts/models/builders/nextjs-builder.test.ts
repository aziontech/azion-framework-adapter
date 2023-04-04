/* eslint-disable prefer-const */
import * as path from 'path';
import * as chai from 'chai';
import * as fs from 'fs';
import * as esbuild from "esbuild";

import { NextjsBuilder } from '../../../../dist/models/builders/nextjs-builder';
import { VercelService } from '../../../../dist/models/builders/services/vercel-service';
import { ManifestBuilderService } from '../../../../dist/models/builders/services/manifest-builder-service';

const { expect } = chai;


describe('NexjsBuilder',()=>{

    afterEach(()=>{
        chai.spy.restore();
    });

    describe('method detectBuildedFunctions',()=>{

        it('should throw an error when statSync fails',()=>{
            const nextjsBuilder = new NextjsBuilder('./fake/path');
            chai.spy.on(fs,'mkdirSync',()=>{return true});
            chai.spy.on(fs,'statSync',()=>{throw new Error('could not find information about this path')});
    
            expect(()=>nextjsBuilder.detectBuildedFunctions()).to.throw('could not find information about this path');
        });

    });

    describe('method handleMiddleware',()=>{

        it('should throw an error if a invalid middleware manifest was given',()=>{
            chai.spy.on(fs,'readFileSync',(p1)=>{
                return '{"runtime":"node", "entrypoint":"index.js"}';
            });

            const nextjsBuilder = new NextjsBuilder('/fake/path');
    
            expect(()=>nextjsBuilder.handleMiddleware())
                .to.throw('Missing properties in middleware-manifest.json');
        });

        it('should throw an error if a no function in functions map was provided',()=>{
            chai.spy.on(fs,'readFileSync',(p1)=>{return '{"middleware":["node"], "functions":["index.js"]}';});
            const nextjsBuilder = new NextjsBuilder('/fake/path');

            expect(()=>nextjsBuilder.handleMiddleware()).to.throw('No functions was provided');
        });
    });

    describe('method build',()=>{

        it('should throw an error if vercelService.createVercelProjectConfig fails',async()=>{
            const vercelService = new VercelService();
            chai.spy.on(vercelService,'createVercelProjectConfig',()=>{
                throw new Error('failed while trying to create vercel project config');
            });
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
            const vercelService = new VercelService();
            chai.spy.on(vercelService,'createVercelProjectConfig',()=>{
                return true;
            });
            chai.spy.on(vercelService,'runVercelBuild',()=>{
                throw new Error('failed while trying to run vercel build');
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

            expect(error.message).to.equals('failed while trying to run vercel build');
        });

        it('should throw en error if vercelService.loadVercelConfigs fails',async()=>{
            const vercelService = new VercelService();
            chai.spy.on(vercelService,'createVercelProjectConfig',()=>{
                return true;
            });
            chai.spy.on(vercelService,'runVercelBuild',()=>{
                return true;
            });
            chai.spy.on(vercelService,'loadVercelConfigs',()=>{
                throw new Error('fail while trying to run loadVercelConfigs');
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

            expect(error.message).to.equal('fail while trying to run loadVercelConfigs');
        });

        it('should throw an error if this.detectBuildedFunctions fails',async()=>{
            const vercelService = new VercelService();
            chai.spy.on(vercelService,'createVercelProjectConfig',()=>{
                return true;
            });
            chai.spy.on(vercelService,'runVercelBuild',()=>{
                return true;
            });
            chai.spy.on(vercelService,'loadVercelConfigs',()=>{
                return true;
            });
            chai.spy.on(fs,'statSync',()=>{
                throw new Error('fs statSync error');
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

            expect(error.message).to.equal('fs statSync error');
        });

        it('should throw an error if vercelService.adapt fails',async ()=>{
            const vercelService = new VercelService();
            chai.spy.on(vercelService,'createVercelProjectConfig',()=>{
                return true;
            });
            chai.spy.on(vercelService,'runVercelBuild',()=>{
                return true;
            });
            chai.spy.on(vercelService,'loadVercelConfigs',()=>{
                return true;
            });
            chai.spy.on(vercelService,'adapt',()=>{
                throw new Error('failed while trying to adapt files');
            });
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
            const manifestBuilderService = new ManifestBuilderService();
            const vercelService = new VercelService();

            chai.spy.on(manifestBuilderService,'assetsPaths',()=>{
                throw new Error('manifest builder service error');
            });
            chai.spy.on(vercelService,'createVercelProjectConfig',()=>{
                return true;
            });
            chai.spy.on(vercelService,'runVercelBuild',()=>{
                return true;
            });
            chai.spy.on(vercelService,'loadVercelConfigs',()=>{
                return true;
            });
            chai.spy.on(vercelService,'adapt',()=>{
                return true;
            });
            chai.spy.on(fs,'statSync',()=>{
                return true;
            });
 
            chai.spy.on(path,'join',()=>{
                return true;
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

            expect(error.message).to.equal('manifest builder service error');
        });

        it('should build project with success',async()=>{
            const manifestBuilderService = new ManifestBuilderService();
            const vercelService = new VercelService();
            
            chai.spy.on(esbuild,'build',()=>{true});
            chai.spy.on(manifestBuilderService,'assetsPaths',()=>{
                return true;
            });
            chai.spy.on(vercelService,'createVercelProjectConfig',()=>{
                return true;
            });
            chai.spy.on(vercelService,'runVercelBuild',()=>{
                return true;
            });
            chai.spy.on(vercelService,'loadVercelConfigs',()=>{
                return {path:'fake/path'};
            });
            chai.spy.on(vercelService,'adapt',()=>{
                return true;
            });
            chai.spy.on(fs,'statSync',()=>{
                return true;
            });
            chai.spy.on(fs,'writeFile',()=>{throw new Error('consegui!!!');});

            const nextjsBuilder = new NextjsBuilder('/fake/path');
            nextjsBuilder.manifestBuilderService = manifestBuilderService;
            nextjsBuilder.vercelService = vercelService;
            chai.spy.on(nextjsBuilder,'handleMiddleware',()=>{
                return true;
            });
            chai.spy.on(nextjsBuilder,'getFunctionsReferenceFileTemplate',()=>{
                return 'string; here;';
            });

            const error = await (async()=>{
                try{
                    await nextjsBuilder.build({versionId:'fakeId'});
                    return {message:true};
                }catch(error:any){
                    return error;
                }
            })();

            expect(error.message).to.equal(true);

            
        });
        
    });



});




