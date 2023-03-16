/* tslint:disable:no-unused-expression no-empty */

import * as child_process from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import * as chai from 'chai';
import { expect } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as spies from 'chai-spies';
import { promisify } from 'util';

import { Builder } from '../../dist/build';
import ManifestBuilder from '../../dist/manifest';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const copy = require('recursive-copy');
const exec = promisify<string, any, { stdout: string, stderr: string }>(child_process.exec);

chai.should();
chai.use(spies);
chai.use(chaiAsPromised);


describe.skip('build', () => {
    let previousPath: string;
    let templatePath: string;
    let builder: Builder;
    let sandbox: ChaiSpies.Sandbox;
    const kvArgs = {
        accessKeyId: "val1",
        secretAccessKey: "val2",
        bucket: "val3",
        region: "val4",
        path: "val5",
        retries: 0
    };

    before(() => {
        sandbox = chai.spy.sandbox();
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        sandbox.on(console, 'log', () => { });
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        sandbox.on(console, 'error', () => { });
    });

    after(() => sandbox.restore());

    describe('success', () => {

        before(async () => {
            templatePath = fs.mkdtempSync(path.join(os.tmpdir(), 'flareact-project'));
            await copy(path.join(process.cwd(), 'test', 'project-examples', 'flareact-test'), templatePath);
            previousPath = process.cwd();
            process.chdir(templatePath);
            await exec('npm install', {});
            builder = new Builder(templatePath);
            builder.createWorkerDir();
        });

        after(() => {
            process.chdir(previousPath);
            fs.rmSync(templatePath, { recursive: true });
        });

        it('should properly create directories on init', async () => {
            const workerDir = fs.existsSync(path.join(templatePath, 'worker'));
            expect(workerDir).to.be.true;
        });

        it('should build client', async () => {
            const clientBuild = builder.buildClient();

            return clientBuild.should.be.fulfilled.then(() => {
                const clientOutput = fs.existsSync(path.join(templatePath, 'out', '_flareact', 'static', 'pages'));
                expect(clientOutput).to.be.true;
            });
        });

        it('should build worker', async () => {
            builder.buildClient();
            const manifest = new ManifestBuilder(templatePath).storageManifest();

            const workerBuild = builder.buildWorker('node_modules/flareact/configs/webpack.worker.config.js', manifest, kvArgs, false);

            return workerBuild.should.be.fulfilled.then(() => {
                const workerDir = fs.existsSync(path.join(process.cwd(), 'worker', 'function.js'));
                expect(workerDir).to.be.true;
            });
        });
    });

    describe('failure', () => {
        before(async () => {
            templatePath = fs.mkdtempSync(path.join(os.tmpdir(), 'flareact-project'));
            await copy(path.join(process.cwd(), 'test', 'project-examples', 'flareact-broken'), templatePath);
            previousPath = process.cwd();
            process.chdir(templatePath);
            await exec('npm install', {});
            builder = new Builder(templatePath);
            builder.createWorkerDir();
        });

        after(() => {
            process.chdir(previousPath);
            fs.rmSync(templatePath, { recursive: true });
        });

        it('should fail build client', async () => {
            const clientBuild = builder.buildClient();
            return clientBuild.should.be.rejected;
        });
    });
});
