import { BootstrapUtils } from '../../../dist/bootstraps/utils';

import * as fs from 'fs';

import * as chai from 'chai';
import { expect } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as spies from 'chai-spies';

chai.should();
chai.use(spies);
chai.use(chaiAsPromised);

describe('bootstrap utils', () => {
    let sandbox: ChaiSpies.Sandbox;
    let bootstrapUtils: BootstrapUtils;
    const bootstrapCode = "console.log('tests!');";
    const entryFilePath = './index.js';
    const entryFileContent = 'console.log("index file!");';
    const entryFileContentWithBoostrap = `${bootstrapCode}\n\n${entryFileContent}`;

    before(() => {
        sandbox = chai.spy.sandbox();
        sandbox.on(console, ['log']);
        sandbox.on(fs, ['writeFileSync']);
    });

    after(() => sandbox.restore());

    describe('addBootstrap success', () => {
        describe('when bootstrap code is not present', () => {
            before(async () => {
                fs.writeFileSync(entryFilePath, entryFileContent);
                bootstrapUtils = new BootstrapUtils(entryFilePath, bootstrapCode);
            });

            after(() => {
                fs.unlink(entryFilePath, (error) => {
                    if (error) console.log(`Error deleting file in test: ${error}`);
                });
            });

            it('should add bootstrap code', () => {
                bootstrapUtils.addBootstrap();

                const fileContent = fs.readFileSync(entryFilePath, {
                    encoding: "utf-8",
                    flag: "r",
                });

                expect(fileContent).to.be.equal(entryFileContentWithBoostrap);
            });
        });

        describe('when bootstrap code is present', () => {
            before(async () => {
                fs.writeFileSync(entryFilePath, entryFileContentWithBoostrap);
                bootstrapUtils = new BootstrapUtils(entryFilePath, bootstrapCode);
            });

            after(() => {
                fs.unlink(entryFilePath, (error) => {
                    if (error) console.log(`Error deleting file in test: ${error}`);
                });
            });

            it('should not add bootstrap code', () => {
                bootstrapUtils.addBootstrap();

                const fileContent = fs.readFileSync(entryFilePath, {
                    encoding: "utf-8",
                    flag: "r",
                });

                expect(fileContent).to.be.equal(entryFileContentWithBoostrap);
                expect(fileContent).not.to.be.equal(bootstrapCode + entryFileContentWithBoostrap);
            });
        });
    });

    describe('addBootstrap failure', () => {
        before(() => {
            bootstrapUtils = new BootstrapUtils('./fake.js', bootstrapCode);
        });

        it('should fail when entry file not exists', async () => {
            bootstrapUtils.addBootstrap();

            expect(console.log).to.have.been.called.with("ERROR in addBootstrap: Error: ENOENT: no such file or directory, open './fake.js'");
        });
    });
});
