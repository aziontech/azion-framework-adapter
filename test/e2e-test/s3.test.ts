// import util = require('node:util');
import * as child_process from 'child_process';
import { promisify } from 'util';
// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
// const exec = util.promisify(require('node:child_process').exec);
const exec = promisify<string, any, { stdout: string, stderr: string }>(child_process.exec);
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const copy = require('recursive-copy');

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
    });

    after(() => {
        if (templatePath) {
            fs.rmSync(templatePath, { recursive: true });
        }
    });

    it('init template flareact"', async () => {
        const { stdout, stderr} = await exec(`azion-framework-adapter init ${template} https://github.com/flareact/flareact-template`,{});
        expect(stdout).to.be.equal('Completed.\n');
    });

    // it('Try to build without the azion.json file', async () => {
    //     const { stdout, stderr} = exec('azion-framework-adapter build');
    //     console.log(stderr)
    //     expect(stdout).to.be.equal("undefined")
    // });

    it('Copy azion.json file ', async () => {
        await copy(path.join(process.cwd(), 'test', 'project-examples', 'azion.json'),path.join(template,'azion.json'))
        const workerDir = fs.existsSync(path.join(template,'azion.json'));
        expect(workerDir).to.be.true;
    });

    it('Try to build', async () => {
        const { stdout, stderr} = await exec('azion-framework-adapter publish',{});
        console.log(stdout, stderr)
        // expect(stdout).to.be.equal("undefined")
    });
})