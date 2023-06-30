import * as child_process from 'child_process';
import * as chai from 'chai';
import * as fs from 'fs';

import type { PrerenderedFileData, VercelConfig, ProcessedVercelOutput } from '../../../../../../dist/models/builders/services/types/vercel-service-types';
import * as vcService from '../../../../../../dist/models/builders/services/vercel-service';

const {processVercelOutput} = vcService;
const { expect } = chai;

describe('process-mapping-service',()=>{
    afterEach(()=>{
        chai.spy.restore();
    });

    describe('processVercelOutput',()=>{
        it('should process the config and build output correctly',()=>{
            const inputtedConfig: VercelConfig = {
                version: 3,
                routes: [
                    { src: '/test-1', dest: '/test-2' },
                    { src: '/use-middleware', middlewarePath: 'middleware' },
                    { handle: 'filesystem' },
                    { src: '/test-3', dest: '/test-4' },
                    { handle: 'miss' },
                    { src: '/test-2', dest: '/test-6' },
                ],
            };
            const inputtedAssets = ['/static/test.png'];
            const inputtedPrerendered = new Map<string, PrerenderedFileData>();
            const inputtedFunctions = new Map<string, string>([
                ['/middleware', '/middleware/index.js'],
                ['/use-middleware', '/use-middleware/index.js'],
            ]);
	
            const processed = processVercelOutput(
                inputtedConfig,
                inputtedAssets,
                inputtedPrerendered,
                inputtedFunctions
            );
	
            const expected: ProcessedVercelOutput = {
                vercelConfig: {
                    version: 3,
                    routes: {
                        none: [
                            { src: '/test-1', dest: '/test-2' },
                            { src: '/use-middleware', middlewarePath: 'middleware' },
                        ],
                        filesystem: [{ src: '/test-3', dest: '/test-4' }],
                        miss: [{ src: '/test-2', dest: '/test-6' }],
                        rewrite: [],
                        resource: [],
                        hit: [],
                        error: [],
                    },
                },
                vercelOutput: new Map([
                    ['/static/test.png', { type: 'static' }],
                    [
                        '/use-middleware',
                        {
                            entrypoint: '/use-middleware/index.js',
                            type: 'function',
                        },
                    ],
                    [
                        'middleware',
                        {
                            entrypoint: '/middleware/index.js',
                            type: 'middleware',
                        },
                    ],
                ]),
            };
	
            expect(Object.keys(processed).toString()).to.equal(Object.keys(expected).toString());
            expect(Object.keys(processed.vercelConfig).toString()).to.equal(Object.keys(expected.vercelConfig).toString());
            expect(Object.keys(processed.vercelOutput).toString()).to.equal(Object.keys(expected.vercelOutput).toString());
        });
    });

    describe('method runVercelBuild',()=>{
        it('should throw an error when execSync fail to execute a command',()=>{
            const vercelSerivice = vcService;
            chai.spy.on(child_process,'execSync',()=>{
                throw new Error('faild to exec vercel build');
            });

            expect(()=>{vercelSerivice.runVercelBuild()}).to.throw('faild to exec vercel build');
        });
    });

    describe('method loadVercelConfigs',()=>{
        
        it('should throw an error when readfilesync fails',()=>{
            const vercelSerivice = vcService;
            chai.spy.on(fs, "readFileSync", () => { throw new Error('failed while trying to read file') });

            expect(()=>vercelSerivice.loadVercelConfigs()).to.throw('failed while trying to read file');
        });

        it('should throw an error when JSON parse fails',()=>{
            const vercelSerivice = vcService;
            chai.spy.on(fs, "readFileSync", () => { return '{"runtime":"node", "entrypoint":"index.js"}'; });
            chai.spy.on(JSON,"parse",()=>{throw new Error('failed while trying to parse data')});

            expect(()=>vercelSerivice.loadVercelConfigs()).to.throw('failed while trying to parse data');
        });
    });

    describe('method createVercelProjectConfig',()=>{

        it('should return an error if mkdirSync fails',()=>{
            const vercelSerivice = vcService;
            chai.spy.on(fs,'existsSync',()=>{return false});
            chai.spy.on(fs,'mkdirSync',()=>{
                throw new Error('fail to create a directory');
            });

            expect(()=>vercelSerivice.createVercelProjectConfig()).to.throw('fail to create a directory');

        });

        it('should return an error if writeFileSync fails',()=>{
            const vercelSerivice = vcService;
            chai.spy.on(fs,'existsSync',()=>{return false});
            chai.spy.on(fs,'mkdirSync',()=>{return undefined});
            chai.spy.on(fs,'writeFileSync',()=>{throw new Error('failed while trying to write file')});

            expect(()=>vercelSerivice.createVercelProjectConfig()).to.throw('failed while trying to write file');
        });
    });
});