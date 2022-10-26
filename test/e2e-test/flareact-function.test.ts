import util = require('node:util');
// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const execFile = util.promisify(require('node:child_process').exec);
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const copy = require('recursive-copy');

import AWS = require('aws-sdk');

import { expect } from 'chai';

describe.only('Create Flareact application', () => {
    let templatePath: string;
    let template: string;
    let realPath: string;
    let localOutput: string;
    const bucketParams = {
        Bucket: "azion-test"
    }

    const s3 = new AWS.S3 ({
        accessKeyId: "123456",
        secretAccessKey: "123456",
        signatureVersion: "v4",
        s3ForcePathStyle: true,
        endpoint: "http://localhost:4566"
    });

    async function getAllKeys(bucketParams: AWS.S3.ListObjectsV2Request,  filesOnS3Bucket: any[]){
        const response = await s3.listObjectsV2(bucketParams).promise();
        response.Contents?.forEach(obj => filesOnS3Bucket.push(obj.Key?.replace('__static_content_test/flareact-e2e/', '')));

        if (response.NextContinuationToken) {
            bucketParams.ContinuationToken = response.NextContinuationToken;
            await getAllKeys(bucketParams, filesOnS3Bucket);
        }
        return filesOnS3Bucket;
    }

    async function removeAllKeys(bucketParams: AWS.S3.ListObjectsV2Request){
        const response = await s3.listObjectsV2(bucketParams).promise();
        const keys: { Key: string; }[] = []
        for(const i of response.Contents??[]){
            if (i.Key !== undefined) {
                keys.push({Key: i.Key})
            }
        }

        s3.deleteObjects({Bucket: bucketParams.Bucket, Delete: { Objects: keys}});
    }

    before(async () => {
        // Creates temporary local template repository
        templatePath = fs.mkdtempSync(path.join(os.tmpdir(), 'flareact-test'));
        realPath = fs.realpathSync(templatePath);
        const templateName = 'flareact-template';
        template = path.join(realPath, templateName);
        console.log("Create template", template);
        localOutput = process.cwd();

        await s3.createBucket(bucketParams).promise();
    });

    // after(() => {
    //     process.chdir(localOutput);
    //     if (templatePath) {
    //         fs.rmSync(templatePath, { recursive: true });
    //     }
    // });

    it('init template flareact"', async () => {
        const { stdout} = await execFile(`azion-framework-adapter init ${template} https://github.com/flareact/flareact-template`);
        expect(stdout).to.be.equal('Completed.\n');
    });

    it('Copy azion.json file ', async () => {
        await copy(path.join(process.cwd(), 'test', 'config-files', 'azion-flareact.json'),path.join(template,'azion.json'))
        const azionConfigFile = fs.existsSync(path.join(template,'azion.json'));
        expect(azionConfigFile).to.be.true;
    });

    it('Install packages', async () => {
        process.chdir(template);
        await execFile('npm install', {});
        const packageLock = fs.existsSync(path.join(template,'package-lock.json'));
        expect(packageLock).to.be.true;
    });

    it('Build the Flareact project', async () => {
        const expectOutput = `Finished client.\n`+
        `Wrote manifest file to ${template}/worker/manifest.json\n`+
        `Finished worker.\n`+
        `Completed.\n`
        const { stdout } = await execFile('azion-framework-adapter build');
        const flareactOutputDir = fs.existsSync(path.join(template,'out/_flareact'));
        expect(stdout).to.be.equal(expectOutput);
        expect(flareactOutputDir).to.be.true;
    });

    it('Publish only function', async () => {
        // const afaStdOutput = await execFile('azion-framework-adapter publish --only-function');

        function run(cmd: string) {
            return new Promise((resolve) => {
                execFile(cmd, (error: any, stdout: any, stderr: any) => {
                    resolve({stdout,stderr, error})
                })
            })
        }
        const afaStdOutput = await run('azion-framework-adapter publish --only-function');
        console.log(afaStdOutput);
    })

    // it('Publish only asset of the flareact to S3', async () => {
    //     removeAllKeys(bucketParams);
    //     const { stdout } =await execFile('azion-framework-adapter publish -s');
    //     const publishOutputMessage = `Loading asset manifest from ${template}/worker/manifest.json\n`;
    //     expect(stdout).to.be.equal(publishOutputMessage);
    //     const filesOnS3Bucket: any[] = [];
    //     await getAllKeys(bucketParams, filesOnS3Bucket);

    //     const manifest = fs.readFileSync(`${template}/worker/manifest.json`);
    //     const manifestArray = Object.values(JSON.parse(manifest.toString()));
    //     const filesOnS3BucketContainManifestFiles = manifestArray.every((each) =>  filesOnS3Bucket.includes(each) );
    //     expect(filesOnS3BucketContainManifestFiles).to.be.true;
    // });
})