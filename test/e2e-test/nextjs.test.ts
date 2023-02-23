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
import { CELLS_SITE_TEMPLATE_WORK_DIR } from '../../dist/constants';

describe.only('Create nextjs application', () => {
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
        response.Contents?.forEach(obj => filesOnS3Bucket.push(obj.Key?.replace('__static_content_test/nextjs-e2e/', '')));

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

        await s3.deleteObjects({Bucket: bucketParams.Bucket, Delete: { Objects: keys}}).promise();
    }

    before(async () => {
        // Creates temporary local template repository
        templatePath = fs.mkdtempSync(path.join(os.tmpdir(), 'nextjs-test'));
        realPath = fs.realpathSync(templatePath);
        const templateName = 'nextjs-template';
        template = path.join(realPath, templateName);
        localOutput = process.cwd();

        await s3.createBucket(bucketParams).promise();

        console.log('Creating Next project');
        await execFile(`npx -y create-next-app@latest --example basic-css ${template}`);
        process.chdir(template);
        await execFile(`npx next build`);
        await execFile(`npx next export`);
    });

    after(() => {
        process.chdir(localOutput);
        if (templatePath) {
            fs.rmSync(templatePath, { recursive: true });
        }
    });

    it('Init cell site template', async () => {

        const expectOutput =`Cloning template repository\n`+
        `Installing dependencies.\n`+
        `All dependencies have been installed!\n`

        process.chdir(template);
        const { stdout} = await execFile(`azion-framework-adapter init -s`);
        expect(stdout).to.be.equal(expectOutput);
    });

    it('Build the nextjs project', async () => {
        const configPath = path.join(template, CELLS_SITE_TEMPLATE_WORK_DIR, 'azion.json');
        const functionPath = path.join(template, CELLS_SITE_TEMPLATE_WORK_DIR, 'worker', 'function.js')
        await copy(path.join(localOutput, 'test', 'config-files', 'azion-next.json'), configPath)
        const expectOutput = `Static site template initialized. Building ...\n`+
        `Finished worker.\n`+
        `Completed.\n`
        const { stdout } = await execFile(`azion-framework-adapter build -c ${configPath} --version-id k0mb1 --static-site --assets-dir ./out || exit $? | 2>&1`);
        const functionContent = fs.readFileSync(functionPath, 'utf8');
        const functionFile = fs.existsSync(functionPath);
        expect(functionContent).to.include('k0mb1');
        expect(stdout).to.be.equal(expectOutput);
        expect(functionFile).to.be.true;
    });

    it.skip('Publish only asset of the nextjs to S3', async () => {
        const configPath = path.join(template, CELLS_SITE_TEMPLATE_WORK_DIR, 'azion.json');
        removeAllKeys(bucketParams);
        const { stdout } =await execFile(`azion-framework-adapter publish -c ${configPath} -t --only-assets --assets-dir ./out || exit $? | 2>&1`);
        const publishOutputMessage = `Loading asset manifest from ${template}/${CELLS_SITE_TEMPLATE_WORK_DIR}/worker/manifest.json\n`;
        expect(stdout).to.be.equal(publishOutputMessage);

        const filesOnS3Bucket: any[] = [];
        await getAllKeys(bucketParams, filesOnS3Bucket);

        const manifest = fs.readFileSync(`${template}/${CELLS_SITE_TEMPLATE_WORK_DIR}/worker/manifest.json`);
        const manifestArray = Object.values(JSON.parse(manifest.toString()));
        const filesOnS3BucketContainManifestFiles = manifestArray.every((each) =>  filesOnS3Bucket.includes(each) );
        expect(filesOnS3BucketContainManifestFiles).to.be.true;
    });
})