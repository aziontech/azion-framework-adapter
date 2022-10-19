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

describe.only('Create Flareact application with error', () => {
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

        await s3.createBucket(bucketParams).promise();
    });

    describe('Build the Flareact project without "azion.json" file and expect it fail', () => {
        before(async () => {
            // Creates temporary local template repository
            templatePath = fs.mkdtempSync(path.join(os.tmpdir(), 'flareact-test'));
            realPath = fs.realpathSync(templatePath);
            const templateName = 'flareact-template';
            template = path.join(realPath, templateName);
            localOutput = process.cwd();
        });

        after(() => {
            process.chdir(localOutput);
            if (templatePath) {
                fs.rmSync(templatePath, { recursive: true });
            }
        });

        it('init template flareact"', async () => {
            const { stdout} = await execFile(`azion-framework-adapter init ${template} https://github.com/flareact/flareact-template`);
            expect(stdout).to.be.equal('Completed.\n');
        });

        it('Install packages', async () => {
            process.chdir(template);
            await execFile('npm install', {});
            const packageLock = fs.existsSync(path.join(template,'package-lock.json'));
            expect(packageLock).to.be.true;
        });

        it('Build the Flareact project without "azion.json" file and expect it fail', async () => {
            const expectOnError =  "Couldn't read file 'azion.json' at the project's root directory. Because ENOENT: no such file or directory, open 'azion.json'\n"

            function run(cmd: string) {
                return new Promise((resolve, _reject) => {
                    execFile(cmd, (error: any, stdout: any, stderr: any) => {
                        resolve({stdout,stderr, error})
                    })
                })
            }
            const afaStdOutput = await run('azion-framework-adapter build');
            const flareactOutputDir = fs.existsSync(path.join(template,'out/_flareact'));
            expect((afaStdOutput as {stdout: string}).stdout).to.be.equal(expectOnError);
            expect(flareactOutputDir).to.be.false;
        });
    })

    describe('Create Flareact application with "azion.json" without S3 credential', () => {

        before(async () => {
            await copy(path.join(localOutput, 'test', 'config-files', 'azion-flareact-without-S3.json'),path.join(template,'azion.json'))
        });

        it('Build the Flareact project with "azion.json" without S3 credentials', async () => {
            const expectOnError =  "S3 credentials not set either in the configuration file or as environment variables.\n"

            function run(cmd: string) {
                return new Promise((resolve, _reject) => {
                    execFile(cmd, (error: any, stdout: any, stderr: any) => {
                        resolve({stdout,stderr, error})
                    })
                })
            }
            const afaStdOutput = await run('azion-framework-adapter build');
            const flareactOutputDir = fs.existsSync(path.join(template,'out/_flareact'));
            expect((afaStdOutput as {stdout: string}).stdout).to.be.equal(expectOnError);
            expect(flareactOutputDir).to.be.false;
        });
    })
})
