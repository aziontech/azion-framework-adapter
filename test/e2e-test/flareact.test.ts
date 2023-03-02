import util = require('node:util');
// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const execFile = util.promisify(require('node:child_process').exec);
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const copy = require('recursive-copy');

import { expect } from 'chai';

function createAzionFile(){
    //creating azion config folder
    if (!fs.existsSync("azion")){
        const azion_project = {
            "type": "flareact"
        };
        
        fs.mkdirSync("azion");
        fs.writeFile('./azion/azion.json', JSON.stringify(azion_project), err => {
            if (err) throw err;
        });
    }
}

describe('Flareact test', () => {
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


    describe("Create Flareact project", () => {
        it('init template"', async () => {
            const { stdout} = await execFile(`azion-framework-adapter init ${template} https://github.com/flareact/flareact-template`);
            expect(stdout).to.be.equal('Completed.\n');
        });

        it('Install packages', async () => {
            process.chdir(template);
            await execFile('npm install', {});
            const packageLock = fs.existsSync(path.join(template,'package-lock.json'));
            expect(packageLock).to.be.true;
        });

        describe.skip("Build the Flareact project", () => {
            before(async () => {
                await copy(path.join(localOutput, 'test', 'config-files', 'azion-flareact.json'),path.join(template,'azion.json'), { overwrite: true})
                createAzionFile();
            })

            it('and expect it pass', async () => {
                const expectOutput = `Wrote manifest file to ${template}/worker/manifest.json\n`+
                `Finished worker.\n`+
                `Completed.\n`
                const { stdout } = await execFile('azion-framework-adapter build');
                const flareactOutputDir = fs.existsSync(path.join(template,'out/_flareact'));
                expect(stdout).to.be.equal(expectOutput);
                expect(flareactOutputDir).to.be.true;
            });
        });
    });
})