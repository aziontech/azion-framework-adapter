/* eslint-disable prefer-const */
import { readFile, mkdir, stat, readdir } from 'fs/promises';
import { dirname, join, relative, resolve } from 'path';
import { readFileSync,writeFileSync} from 'fs';
import { build } from 'esbuild';
import path = require('path');
import * as chai from 'chai';
import { tmpdir } from 'os';
import * as vm from 'vm';
import * as os from 'os';


import { WORKER_DIR } from '../../../../dist/constants';
import { ErrorCode,FailedToBuild } from '../../../../dist/errors';
import { Builder } from '../../../../dist/models/builders/builder';
import { NextjsBuilder } from '../../../../dist/models/builders/nextjs-builder'

const { expect } = chai;

function getContext(){
    return {
        ErrorCode:ErrorCode,
        FailedToBuild:FailedToBuild,
        path_1:path,
        readFile:readFile,
        readFileSync:readFileSync,
        mkdir:mkdir,
        stat:stat,
        readdir:readdir,
        dirname:dirname,
        join:join,
        relative:relative,
        resolve:resolve,
        build:build,
        tmpdir:tmpdir,
        builder_1:{Builder:Builder},
        process:process,
        nextjsBuilderInstance:undefined,
        __filename:__filename,
        WORKER_DIR:WORKER_DIR,
        os_1:os,
        response:false,
        has_an_error:false,
        error_name:false,
        writeFileSync:writeFileSync,
        msg:'',
    };
}


describe.only('Nextjs Builder', () => {

    describe('method createVercelProjectConfig()',()=>{
        it("should rize an error if writeFile method throws an error",async()=>{

            // eslint-disable-next-line prefer-const
            let ctx_sut = {
                ...getContext(),
                fs_1:{
                    existsSync:(param:string)=>{
                        console.log(param);
                        return false
                    },
                    mkdirSync:(param1:string,param2:string)=>{
                        console.log(param1,param2);
                        return true;
                    }
                },
                promises_1:{
                    writeFile:(param:string)=>{
                        console.log(param);
                        throw new Error('eita');
                    }
                }
            }

            let code = NextjsBuilder.toString();
    
            code += `
            (async()=>{
                try{
                    nextjsBuilderInstance = new NextjsBuilder(process.cwd());
                    await nextjsBuilderInstance.createVercelProjectConfig();
                }catch(err){
                    has_an_error = true;
                    error_name = err.name;
                    msg = err.message;
                }
            })();
            `; 
    
            await vm.runInNewContext(code,ctx_sut);
    
            expect(ctx_sut.has_an_error).to.be.true;
            expect(ctx_sut.error_name).to.be.equal('Error');
            expect(ctx_sut.msg).to.be.equal('Error: Error: eita');
        });

        it('should rize an error if mkdirSync method throws an error',async ()=>{

            let ctx_sut = {
                ...getContext(),
                fs_1:{
                    existsSync:(param:string)=>{
                        console.log(param);
                        return false
                    },
                    mkdirSync:(param1:string,param2:string)=>{
                        console.log(param1,param2);
                        throw new Error('fs_1.mkdir error');
                    }
                },
                promises_1:{}
            };
            
            let code1 = NextjsBuilder.toString();
            
            code1 += `
            (async()=>{
                try{
                    nextjsBuilderInstance = new NextjsBuilder(process.cwd());
                    await nextjsBuilderInstance.createVercelProjectConfig();
                    msg ='no error';
                }catch(err){
                    has_an_error = true;
                    error_name = err.name;
                    msg = err.message;
                }
            })();
            `;

            await vm.runInNewContext(code1,ctx_sut);
            expect(ctx_sut.has_an_error).to.be.true;
            expect(ctx_sut.msg).to.be.equal('Error: Error: fs_1.mkdir error');
            expect(ctx_sut.error_name).to.be.equal('Error');
        });

    });

    // describe('method runVercelBuild()',async()=>{
    //     it('',async()=>{
    //         let ctx_sut = {
    //             ...getContext(),
    //             console:console
    //         };
    //         let code = NextjsBuilder.toString();
    //         code +=

    //     });
    // });
});