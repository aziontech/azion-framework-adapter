import * as child_process from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as spies from 'chai-spies';
import rewire = require('rewire');

import { ErrorCode, NotADirectory } from '../../dist/errors';
import * as init from '../../dist/init';

const exec = promisify<string, any, { stdout: string, stderr: string }>(child_process.exec);

chai.should();
chai.use(spies);
chai.use(chaiAsPromised);


describe('init', () => {

    let emptyDir: string;
    let notEmptyDir: string;
    let tmpFile: string;
    let nonExistingDir: string;
    let sandbox: ChaiSpies.Sandbox;
    let introspectedInit: any;
    let consoleOutput: any[];
    let templatePath: string;
    let template: string;

    before(() => {

        // Creates temporary local template repository
        templatePath = fs.mkdtempSync(path.join(os.tmpdir(), 'flareact-test'));
        const templateName = 'flareact-template';
        template = path.join(templatePath, templateName);

        // create local temporary template
        child_process.execSync(`git -C ${templatePath} init ${templateName}`, { encoding: 'utf-8' });

        // add package.json
        fs.writeFileSync(path.join(template, 'package.json'), JSON.stringify({}));
        child_process.execSync(`git -C ${template} add package.json`, { encoding: 'utf-8' });
        child_process.execSync(`git -C ${template} commit -m Begin`, { encoding: 'utf-8' });
    });

    after(() => {
        if (templatePath) {
            fs.rmSync(templatePath, { recursive: true });
        }
    });

    beforeEach(() => {

        // "imports" and allows access to private members
        introspectedInit = rewire('../../dist/init');

        sandbox = chai.spy.sandbox();
        consoleOutput = new Array<string>();
        // intercepts console.log for checking and also silence it
        sandbox.on(console, 'log', function () {
            // eslint-disable-next-line prefer-rest-params
            consoleOutput.push(arguments);
        });

        notEmptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flareact-filled-tst'));
        tmpFile = notEmptyDir + "/tmp_file";
        fs.writeFileSync(tmpFile, "");

        emptyDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flareact-empty-tst'));

        nonExistingDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flareact-non-existing-tst'));
        fs.rmSync(nonExistingDir, { recursive: true });
    });

    afterEach(() => {
        sandbox.restore();
        if (notEmptyDir) {
            fs.rmSync(notEmptyDir, { recursive: true });
        }
        if (emptyDir) {
            fs.rmSync(emptyDir, { recursive: true });
        }
    });

    describe('directory validation', () => {

        it('empty directory should be valid', () => {

            // reference to private member
            const validateTargetDirectory = introspectedInit.__get__("validate_target_directory");

            const result = validateTargetDirectory(emptyDir);

            // tslint:disable-next-line:no-unused-expression
            result.ok.should.be.true;

        });

        it('non existing directory should be valid', () => {

            // reference to private member
            const validateTargetDirectory = introspectedInit.__get__("validate_target_directory");

            const result = validateTargetDirectory(nonExistingDir);

            // tslint:disable-next-line:no-unused-expression
            result.ok.should.be.true;

        });

        it('not empty directory should be invalid', () => {

            // reference to private member
            const validateTargetDirectory = introspectedInit.__get__("validate_target_directory");

            const result = validateTargetDirectory(notEmptyDir);

            result.val.should.be.a('directorynotempty');
            result.val.message.should.include(notEmptyDir);

        });

        it('path should not be a file', () => {

            // reference to private member
            const validateTargetDirectory = introspectedInit.__get__("validate_target_directory");

            const result = validateTargetDirectory(tmpFile);

            result.val.should.be.a('notadirectory');
            result.val.message.should.include(tmpFile);

        });
    });

    describe('cloning', () => {
        it('remote origin should be removed', async () => {

            // reference to private member
            const initFunc = introspectedInit.__get__("init");

            await initFunc(emptyDir, template, {});

            const { stdout, stderr } = await exec("git remote -v", { cwd: emptyDir });


            stderr.should.equal("");
            stdout.should.equal("");


        });
        it('should fail when path is invalid', async () => {

            // reference to private member
            const initFunc = introspectedInit.__get__("init");

            const result = await initFunc(tmpFile, template, {});


            result.val.should.be.a('notadirectory');
            result.val.message.should.include(tmpFile);


        });
        it('should fail when template is invalid', async () => {

            const templateRepository = "https://github.com/aziontech/flareact4azion-template-does-not-exist";

            // reference to private member
            const initFunc = introspectedInit.__get__("init");

            const result = await initFunc(emptyDir, templateRepository, {});


            result.val.should.be.a('cannotclonetemplate');


        });
    });

    describe('executing command', () => {

        it('should get message completed and rename package', async () => {

            await init.exec(emptyDir, template, { projectName: "unit-test-project-name" });

            const packageJsonContent = fs.readFileSync(path.join(emptyDir, "package.json"), { encoding: 'utf-8' });
            const packageJson = JSON.parse(packageJsonContent);

            console.log.should.have.been.called.with("Completed.");
            packageJson.name.should.equal("unit-test-project-name");

        });

        it('should fail when path is invalid', async () => {

            const result = await init.exec(tmpFile, template, {});

            result.should.equal(ErrorCode.NotADirectory);
            console.log.should.have.been.called.with(new NotADirectory(tmpFile).message);

        });


        it('should catch deep unknown error', async () => {

            // private member mockup
            introspectedInit.__set__("validate_target_directory", () => {
                throw new Error("Very Unknown Error");
            });

            const result = await introspectedInit.exec(emptyDir, template, {});


            result.should.equal(ErrorCode.Unknown);
            // tslint:disable-next-line:no-unused-expression
            console.log.should.have.been.called.once;
            consoleOutput[0][0].toString().should.include("Very Unknown Error");

        });
    });
});

