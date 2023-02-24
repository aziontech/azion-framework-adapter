import * as fs from 'fs';
import * as path from 'path';
import * as chai from 'chai';
import * as sinonChai from "sinon-chai";
import * as sinon from "sinon";

import { Builder } from '../../../../dist/models/builders/builder';
import { StaticSiteBuilder } from '../../../../dist/models/builders/static-site-builder';
import { FailedToBuild } from '../../../../dist/errors';


chai.use(sinonChai);

const { expect } = chai;

describe('Builder', () => {
    let builder: Builder;
    let currentDir: string;
    let workerDir: string;

    before(() => {
        currentDir = process.cwd();
        builder = new StaticSiteBuilder(currentDir);
        workerDir = path.join(builder.targetDir, "worker");
    });

    describe('when a new instance is created', () => {
        it('should set correct target dir', () => {
            expect(builder.targetDir).to.be.equal(currentDir);
        });
    });

    describe('when create a worker dir', () => {
        afterEach(() => {
            fs.rmSync(workerDir, { recursive: true });
        });

        describe('that specified path already exists and is NOT a dir', () => {
            before(() => {
                fs.writeFileSync(workerDir, 'fileDataMock');
            });

            it('should throw an error', () => {
                expect(() => builder.createWorkerDir()).to.throw(
                    FailedToBuild, workerDir, "cannot create 'worker' directory"
                );
            });
        });

        describe('that specified path already exists and is a dir', () => {
            before(() => {
                fs.mkdirSync(workerDir);
            });

            it('should NOT take actions', () => {
                const spy = sinon.spy(fs, "mkdirSync");

                builder.createWorkerDir();

                expect(spy).to.not.have.been.called;
            });
        });

        describe('that NOT exists', () => {
            it('should create a new dir', () => {
                builder.createWorkerDir();

                expect(fs.existsSync(workerDir)).to.be.true;
            });
        });
    });
});