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

describe('Create nextjs application', () => {
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

    before(async () => {
        // Creates temporary local template repository
        templatePath = fs.mkdtempSync(path.join(os.tmpdir(), 'nextjs-test'));
        realPath = fs.realpathSync(templatePath);
        const templateName = 'nextjs-template';
        template = path.join(realPath, templateName);
        localOutput = process.cwd();

        await s3.createBucket(bucketParams).promise();
    });

    after(() => {
        process.chdir(localOutput);
        if (templatePath) {
            fs.rmSync(templatePath, { recursive: true });
        }
    });

    it('init template nextjs"', async () => {
        console.log('Creating Next project');
        await execFile(`npx -y create-next-app@latest ${template}`);
        const data = fs.readFileSync(`${template}/pages/index.js`);
        const dataToString = data.toString();
        const dataToArray = dataToString.split('\n');
        dataToArray.splice(1,1); //Remove import of NextJS/Image
        dataToArray.splice(61,1,'               <img src="/vercel.svg" alt="Vercel Logo" width="72" height="16" />\n');
        const arrayToText =  dataToArray.join('\n');
        fs.writeFileSync(`${template}/pages/index.js`,arrayToText)
        process.chdir(template);
        await execFile(`npx next build`);
        await execFile(`npx next export`);
    });

    it('Clone cell site template', async () => {
        process.chdir(template);
        const { stdout} = await execFile(`azion-framework-adapter init cells-site-template https://github.com/aziontech/cells-site-template`);
        expect(stdout).to.be.equal('Completed.\n');
    });

    it('Install dependencies', async () => {
        process.chdir('./cells-site-template');
        await execFile('npm install');
        const packageLock = fs.existsSync(path.join(template,'./cells-site-template/package-lock.json'));
        expect(packageLock).to.be.true;
    });


    it('Copy azion.json file ', async () => {
        await copy(path.join(localOutput, 'test', 'config-files', 'azion-next.json'),path.join(template,'./cells-site-template/azion.json'))
        const azionConfigFile = fs.existsSync(path.join(template,'./cells-site-template/azion.json'));
        expect(azionConfigFile).to.be.true;
    });

    it('Build the nextjs project', async () => {
        const expectOutput = `Wrote manifest file to ${template}/cells-site-template/worker/manifest.json\n`+
        `Finished worker.\n`+
        `Completed.\n`
        const { stdout } = await execFile('azion-framework-adapter build --static-site --assets-dir ../out');
        const nextjsOutputDir = fs.existsSync(path.join(template,'/cells-site-template/worker/function.js'));
        expect(stdout).to.be.equal(expectOutput);
        expect(nextjsOutputDir).to.be.true;
    });

    it('Publish only asset of the nextjs to S3', async () => {
        const { stdout } =await execFile('azion-framework-adapter publish --only-assets --assets-dir ../out');
        const publishOutputMessage = `Loading asset manifest from ${template}/cells-site-template/worker/manifest.json\n`;
        expect(stdout).to.be.equal(publishOutputMessage);
    });

    it("Compare manifest with the list of files on S3 Bucket", async () => {
        const filesOnS3Bucket: any[] = [];
        async function getAllKeys(bucketParams: AWS.S3.ListObjectsV2Request,  filesOnS3Bucket: any[]){
            const response = await s3.listObjectsV2(bucketParams).promise();
            response.Contents?.forEach(obj => filesOnS3Bucket.push(obj.Key?.replace('__static_content_test/nextjs-e2e/', '')));

            if (response.NextContinuationToken) {
                bucketParams.ContinuationToken = response.NextContinuationToken;
                await getAllKeys(bucketParams, filesOnS3Bucket);
            }
            return filesOnS3Bucket;
        }

        await getAllKeys(bucketParams, filesOnS3Bucket);

        const manifest = fs.readFileSync(`${template}/cells-site-template/worker/manifest.json`);
        const manifestArray = Object.values(JSON.parse(manifest.toString()));
        const filesOnS3BucketContainManifestFiles = manifestArray.every((each) =>  filesOnS3Bucket.includes(each) );
        expect(filesOnS3BucketContainManifestFiles).to.be.true;
    });
})