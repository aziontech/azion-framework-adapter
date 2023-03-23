import util = require('node:util');
// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const execFile = util.promisify(require('node:child_process').exec);
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { expect } from 'chai';

describe('Create nextjs static application', () => {
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

    it('Build the nextjs project', async () => {
        const functionPath = path.join(template, 'azion', 'worker', 'function.js')
        const expectOutput = `Initialising build.\n`+
        `Completed.\n`

        //npm_config_registry=https://registry.npmjs.org npx xxx
        const stdout = await execFile(`npm_config_registry=http://0.0.0.0:4873/ npx --yes azion-framework-adapter build -s --version-id k0mb1 || exit $? | 2>&1`);
        const functionContent = fs.readFileSync(functionPath, 'utf8');
        const functionFile = fs.existsSync(functionPath);

        expect(functionContent).to.include('k0mb1');
        expect(stdout.stdout).to.include(expectOutput);
        expect(functionFile).to.be.true;
    });
})
