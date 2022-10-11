import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as spies from 'chai-spies';
import { read_config } from '../../dist/config';

import { EdgeFunction } from '../../dist/azion-api';
import { AzionPublisher, Config } from '../../dist/azion-publisher';
import ManifestBuilder from '../../dist/manifest';

import { AzionCredentialsNotSet } from '../../dist/errors';

chai.should();
chai.use(spies);
chai.use(chaiAsPromised);

describe('Azion Publisher', () => {

    let tempDir: string;
    let azionData: any[];
    let azionMockup: any;


    const directories = {
        out: {
            A: {
                A: {
                    "A.js": "Content of A.js",
                    "B.d.ts": "Content of B.d.ts",
                    "C.json": "Content of C.json",
                    "D.jpg": "Content of D.jpg"
                },
                "B.js": "Content of B.js",
                "C.d.ts": "Content of C.d.ts",
                "D.json": "Content of D.json",
                "E.jpg": "Content of E.jpg"
            },
            B: {
                "A.js": "Content of A.js",
                "B.d.ts": "Content of B.d.ts",
                "C.json": "Content of C.json",
                "D.jpg": "Content of D.jpg"
            },
            C: {}
        }
    };

    function makeDirectoryStructure(rootPath: string, directoryStructure: any) {
        for (const prop of Object.getOwnPropertyNames(directoryStructure)) {
            const item = directoryStructure[prop];
            const tp = typeof item;
            const nextPath = path.join(rootPath, prop);
            if (tp === 'object') {
                fs.mkdirSync(nextPath);
                makeDirectoryStructure(nextPath, item);
            } else {
                fs.writeFileSync(nextPath, item);
            }
        }
    }

    before(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flareact-test'));
        makeDirectoryStructure(tempDir, directories);
        fs.mkdirSync(path.join(tempDir, 'worker'));
        const manifestBuilder = new ManifestBuilder(tempDir);
        manifestBuilder.storageManifest();
        fs.writeFileSync(path.join(tempDir, 'worker/function.js'), "Worker Code");

    });

    beforeEach(() => {

        azionData = new Array<any>();
        azionMockup = {
            url: "",
            token: "",
            getToken(): Promise<string> { return Promise.resolve(""); },
            saveFunction(params: any): Promise<EdgeFunction> {
                azionData.push(params);
                return Promise.resolve({
                    id: 1,
                    name: "MyFunctionName",
                    code: "",
                    language: "",
                    active: true,
                    json_args: {}
                });
            }
        };
    });

    after(() => {
        if (tempDir) {
            fs.rmdirSync(tempDir, { recursive: true });
        }
    });

    // Doesn't look at the manifest only if the file content was sent through the API
    it('publish to Azion', async () => {
        const rawCfg: Config = {
            azion: {
                token: "azion-personal-token",
                function_name: "MyFunctionName"
            }
        };
        const args: any = {
            args: "This is a test JSONArgs"
        };
        fs.writeFileSync(path.join(tempDir, "args.json"), JSON.stringify(args));
        const cfg: Config = await AzionPublisher.getConfig(rawCfg, process.env);
        const publisher = new AzionPublisher(azionMockup, tempDir, cfg);
        publisher.deployEdgeFunction();

        azionData.length.should.be.equal(1);
        azionData[0].name.should.be.equal("MyFunctionName");
        azionData[0].code.should.be.equal("Worker Code");

        // tslint:disable-next-line:no-unused-expression
        azionData[0].active.should.be.true;
        azionData[0].json_args.should.be.deep.equal({ args: 'This is a test JSONArgs' });
    });

    it('accepts additional config parameters', async () => {
        const rawCfg: any = {
            azion: {
                token: "azion-personal-token",
                function_name: "MyFunctionName"
            },
            kv: {
                accessKeyId: "1",
                secretAccessKey: "2",
                region: "3",
                bucket: "4",
                path: "5"
            }
        };
        await AzionPublisher.getConfig(rawCfg, process.env);
    });

    it("should complain if configuration and environment don't have Azion credentials", async () => {
        const tempFileNoAzionCredentials = path.join(tempDir, "cfg-temp_file_no_azion_credentials.json");
        fs.writeFileSync(tempFileNoAzionCredentials, JSON.stringify({
            azion: {
                function_name: 'val8'
            }
        }, null, " "));

        const env = {};
        const options = { config: tempFileNoAzionCredentials };
        const rawReadCfg = await read_config(options);
        const config = AzionPublisher.getConfig(rawReadCfg, env);
        return config.should.be.eventually.rejectedWith(AzionCredentialsNotSet);
    });
});
