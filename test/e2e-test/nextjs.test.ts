import util = require('node:util');
// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const execFile = util.promisify(require('node:child_process').exec);
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const copy = require('recursive-copy');

import { expect } from 'chai';
import { CELLS_SITE_TEMPLATE_WORK_DIR } from '../../dist/constants';

describe.skip('Create nextjs application', () => {
    let templatePath: string;
    let template: string;
    let realPath: string;
    let localOutput: string;


    before(async () => {
        // Creates temporary local template repository
        templatePath = fs.mkdtempSync(path.join(os.tmpdir(), 'nextjs-test'));
        realPath = fs.realpathSync(templatePath);
        const templateName = 'nextjs-template';
        template = path.join(realPath, templateName);
        localOutput = process.cwd();

        console.log('Creating Next project');
        await execFile(`npx -y create-next-app@latest --example basic-css ${template}`);
        process.chdir(template);
        await execFile('npm i -S next@12.2.6');
        await execFile(`npx next build`);
        await execFile(`npx next export`);

        //creating azion config folder
        if (!fs.existsSync("azion")){
            const azion_project = {
                "type": "nextjs"
            };
    
            fs.mkdirSync("azion");
            fs.writeFile('./azion/azion.json', JSON.stringify(azion_project), err => {
                if (err) throw err;
            });
        }
    
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
})