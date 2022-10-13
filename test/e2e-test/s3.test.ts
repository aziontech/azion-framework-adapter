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

describe.only('Test S3', () => {
    let templatePath: string;
    let template: string;

    before(() => {
        // Creates temporary local template repository
        templatePath = fs.mkdtempSync(path.join(os.tmpdir(), 'flareact-test'));
        const templateName = 'flareact-template';
        template = path.join(templatePath, templateName);
        console.log("Temporary directory", template);

        const s3 = new AWS.S3 ({
            accessKeyId: "123456",
            secretAccessKey: "123456",
            signatureVersion: "v4",
            s3ForcePathStyle: true,
            endpoint: "http://localhost:4566"
        });

        const bucketParams = {
            Bucket: "azion-test"
        }

        s3.createBucket(bucketParams, function(err, data) {
            if (err) {
                console.log("Error", err);
            } else {
                console.log("success", data.Location)
            }
        })
    });

    // after(() => {
    //     if (templatePath) {
    //         fs.rmSync(templatePath, { recursive: true });
    //     }
    // });

    it('init template flareact"', async () => {
        const { stdout} = await execFile(`azion-framework-adapter init ${template} https://github.com/flareact/flareact-template`);
        expect(stdout).to.be.equal('Completed.\n');
    });

    it('Copy azion.json file ', async () => {
        await copy(path.join(process.cwd(), 'test', 'project-examples', 'azion.json'),path.join(template,'azion.json'))
        const azionConfigFile = fs.existsSync(path.join(template,'azion.json'));
        expect(azionConfigFile).to.be.true;
    });

    it('Install packages', async () => {
        process.chdir(template);
        await execFile('npm install', {});
        const packageLock = fs.existsSync(path.join(template,'package-lock.json'));
        expect(packageLock).to.be.true;
    });

    it('Try to build', async () => {
        const expectOutput = `Finished client.
Wrote manifest file to ${template}/worker/manifest.json
Finished worker.
Completed.\n`
        const { stdout } = await execFile('azion-framework-adapter build');
        const flareactOutputDir = fs.existsSync(path.join(template,'out/_flareact'));
        expect(stdout).to.be.equal(expectOutput);
        expect(flareactOutputDir).to.be.true;
    });

    it('Try to publish', async () => {
        const { stdout } =await execFile('azion-framework-adapter publish -s');
        const publishOutputMessage = `Loading asset manifest from ${template}/worker/manifest.json\n`;
        expect(stdout).to.be.equal(publishOutputMessage);
    });

    it("List assets on S3 Bucket", () => {
        const s3 = new AWS.S3 ({
            accessKeyId: "123456",
            secretAccessKey: "123456",
            signatureVersion: "v4",
            s3ForcePathStyle: true,
            endpoint: "http://localhost:4566"
        });

        const bucketParams = {
            Bucket: "azion-test"
        }

        s3.listObjectsV2(bucketParams, function (err, data) {
            if (err) {
                console.log("Error", err);
            } else {
                console.log("success", data.Name, data.Contents?.map(assets => assets.Key?.replace('__static_content_test/first-contact-e2e/', '')));
            }
        })

        const manifest = fs.readFileSync(`${template}/worker/manifest.json`);
        console.log("manifest", JSON.parse(manifest.toString()));
    });
})