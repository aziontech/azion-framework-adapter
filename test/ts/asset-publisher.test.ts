import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as spies from 'chai-spies';

import { AssetPublisher, Config } from '../../dist/asset-publisher';
import { read_config } from '../../dist/config';
import { S3CredentialsNotSet } from '../../dist/errors';
import ManifestBuilder from '../../dist/manifest';

chai.should();
chai.use(spies);
chai.use(chaiAsPromised);

describe('Asset Publisher', () => {

    let tempDir: string;
    let s3Data: any[];
    let s3Mockup: any;

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

        s3Data = new Array<any>();
        s3Mockup = {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            upload(params: any, options: any) {
                s3Data.push(params);
                return {
                    promise() {
                        return Promise.resolve();
                    }
                };
            }
        };
    });

    after(() => {
        if (tempDir) {
            fs.rmdirSync(tempDir, { recursive: true });
        }
    });

    // Doesn't look at the manifest only if the file content was sent through the API
    it('publish to S3', async () => {
        const rawCfg: Config = {
            kv: {
                accessKeyId: "1",
                secretAccessKey: "2",
                region: "3",
                bucket: "4",
                path: "5"
            }
        };
        const cfg: Config = await AssetPublisher.getConfig(rawCfg, process.env);
        const publisher = new AssetPublisher(tempDir, s3Mockup, cfg);
        publisher.deployStaticAssets();
        s3Data.length.should.be.equal(12);

    });

    it('should accept additional config parameters', async () => {
        const rawCfg: any = {
            azion: {
                id: "6",
                secret: "7",
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
        await AssetPublisher.getConfig(rawCfg, process.env);
    });

    it("should complain if configuration and environment don't have S3 credentials", async () => {
        const tempFileNoS3Credentials = path.join(tempDir, "cfg-temp_file_no_s3_credentials.json");
        fs.writeFileSync(tempFileNoS3Credentials, JSON.stringify({
            kv: {
                bucket: "val3",
                region: "val4",
                path: "val5"
            },
        }, null, " "));

        const env = {};
        const options = { config: tempFileNoS3Credentials };
        const rawReadCfg = await read_config(options);
        const config = AssetPublisher.getConfig(rawReadCfg, env);
        return config.should.be.eventually.rejectedWith(S3CredentialsNotSet);
    });
});
