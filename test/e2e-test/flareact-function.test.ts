import util = require('node:util');
// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const execFile = util.promisify(require('node:child_process').exec);
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const copy = require('recursive-copy');

import { expect } from 'chai';

describe('Create Flareact application to publish only the function', () => {
    let templatePath: string;
    let template: string;
    let realPath: string;
    let localOutput: string;

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

    it('Copy azion.json file with wrong token ', async () => {
        await copy(path.join(process.cwd(), 'test', 'config-files', 'azion-flareact-with-wrong-token.json'),path.join(template,'azion.json'))
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

    it('Try to publish only function with wrong token and expect to fail', async () => {
        const expectOutput = 'Cannot save edge function to Azion: {"detail":"Invalid token"}\n';
        function run(cmd: string) {
            return new Promise((resolve) => {
                execFile(cmd, (error: any, stdout: any, stderr: any) => {
                    resolve({stdout,stderr, error})
                })
            })
        }
        const afaStdOutput = await run('azion-framework-adapter publish --only-function');
        expect((afaStdOutput as {stdout: string}).stdout).to.be.equal(expectOutput);
    })

    it('Copy azion.json file with rigth token ', async () => {
        await copy(path.join(localOutput, 'test', 'config-files', 'azion-flareact.json'),path.join(template,'azion.json'), { overwrite: true})
        const azionConfigFile = fs.existsSync(path.join(template,'azion.json'));
        expect(azionConfigFile).to.be.true;
    });

    it('Publish only function', async () => {
        const expectOutput = 'Function id: 1\n';
        function run(cmd: string) {
            return new Promise((resolve) => {
                execFile(cmd, (error: any, stdout: any, stderr: any) => {
                    resolve({stdout,stderr, error})
                })
            })
        }
        const afaStdOutput = await run('azion-framework-adapter publish --only-function');
        expect((afaStdOutput as {stdout: string}).stdout).to.be.equal(expectOutput);
    })
})