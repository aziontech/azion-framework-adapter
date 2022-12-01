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
        const expectOutput = `Export successful. Files written to ${template}/out`
        await execFile(`npx -y create-next-app@latest --example basic-css ${template}`);
        process.chdir(template);
        await execFile(`npx next build`);
        const { stdout } = await execFile(`npx next export`);
        expect(stdout).to.have.string(expectOutput)
    });

    after(() => {
        process.chdir(localOutput);
        if (templatePath) {
            fs.rmSync(templatePath, { recursive: true });
        }
    });

    // it('init template nextjs"', async () => {
    //     console.log('Creating Next project');
    //     const expectOutput = `Export successful. Files written to ${template}/out`
    //     await execFile(`npx -y create-next-app@latest --example basic-css ${template}`);
    //     process.chdir(template);
    //     await execFile(`npx next build`);
    //     const { stdout } = await execFile(`npx next export`);
    //     expect(stdout).to.have.string(expectOutput);
    // });

    // it('Clone cell site template', async () => {
    //     process.chdir(template);
    //     const { stdout} = await execFile(`azion-framework-adapter init cells-site-template https://github.com/aziontech/cells-site-template`);
    //     expect(stdout).to.be.equal('Completed.\n');
    // });

    // it('Install dependencies', async () => {
    //     process.chdir('./cells-site-template');
    //     await execFile('npm install');
    //     const packageLock = fs.existsSync(path.join(template,'./cells-site-template/package-lock.json'));
    //     expect(packageLock).to.be.true;
    // });


    // it('Copy azion.json file ', async () => {
    //     await copy(path.join(localOutput, 'test', 'config-files', 'azion-next.json'),path.join(template,'./azion.json'))
    //     const azionConfigFile = fs.existsSync(path.join(template,'./azion.json'));
    //     expect(azionConfigFile).to.be.true;
    // });

    it('Build the nextjs project', async () => {
        await copy(path.join(localOutput, 'test', 'config-files', 'azion-next.json'),path.join(template,'./azion.json'))
        const expectOutput = `Creating azion directory\n`+
        `Cloning template repository\n`+
        `Installing dependencies.\n`+
        `All dependecies instaleds!\n`+
        `Wrote manifest file to ${template}/azion/cells-site-template/worker/manifest.json\n`+
        `Finished worker.\n`+
        `Build completed.\n`

        //A função clona o repositório cells-site-template e então muda para dentro dele para executar o processo de build. Por isso o caminho para o arquivo de configuração
        //e para os assets são passados relativos ao caminho /azion/cell-site-template
        const { stdout } = await execFile('azion-framework-adapter build --static-site --config ../../azion.json --assets-dir ../../out || exit $? | 2>&1');
        const nextjsOutputDir = fs.existsSync(path.join(template,'/azion/cells-site-template/worker/function.js'));
        expect(stdout).to.be.equal(expectOutput);
        expect(nextjsOutputDir).to.be.true;
    });

    it('Publish only asset of the nextjs to S3', async () => {
        //No processo de publish, antes é necessário mudar para a pasta /azion/cells-site-template
        //Uma opção é que a função de publish tambem alterne para a pasta do cells-site-template, mas ainda assim fica estranho os caminhos relativos dos
        //parametros de configuração e assets
        //Funciona bem para o uso com o aziocli, mas para o uso direto do framework-adapter não fica bom.
        process.chdir('./azion/cells-site-template');
        removeAllKeys(bucketParams);
        const { stdout } =await execFile('azion-framework-adapter publish --only-assets --config ../../azion.json --assets-dir ../../out || exit $? | 2>&1');
        const publishOutputMessage = `Loading asset manifest from ${template}/azion/cells-site-template/worker/manifest.json\n`;
        expect(stdout).to.be.equal(publishOutputMessage);

        const filesOnS3Bucket: any[] = [];
        await getAllKeys(bucketParams, filesOnS3Bucket);

        const manifest = fs.readFileSync(`${template}/azion/cells-site-template/worker/manifest.json`);
        const manifestArray = Object.values(JSON.parse(manifest.toString()));
        const filesOnS3BucketContainManifestFiles = manifestArray.every((each) =>  filesOnS3Bucket.includes(each) );
        expect(filesOnS3BucketContainManifestFiles).to.be.true;
    });
})