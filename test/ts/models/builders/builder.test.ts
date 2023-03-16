import * as fs from 'fs';
import * as path from 'path';
import * as chai from 'chai';

import { Builder } from '../../../../dist/models/builders/builder';
import { StaticSiteBuilder } from '../../../../dist/models/builders/static-site-builder';
import { error } from 'console';


const { expect } = chai;

describe.skip('Builder', () => {
    let builder: Builder;
    let currentDir: string;
    let workerDir: string;

    before(() => {
        currentDir = './out';
        builder = new StaticSiteBuilder(currentDir);


        workerDir = path.join(builder.targetDir,"azion", "worker");
    });

    describe('when a new instance is created', () => {
        it('should set correct target dir', () => {
            expect(builder.targetDir).to.be.equal(currentDir);
        });
    });

    describe('when create a worker dir', () => {
        beforeEach(() => {
            chai.spy.restore();
        })
        afterEach(() => {
            if(fs.existsSync(workerDir)){
                fs.rmSync(workerDir, { recursive: true });
            }
        });

        describe('that specified path already exists and is NOT a dir', () => {
            it('should throw an error', async () => {
                chai.spy.on(fs, "mkdirSync", () => { throw error });

                expect( () => builder.createWorkerDir()).to.throw("Failed to build project. Directory: out/azion/worker. Because: cannot create 'worker' directory");

            });
        });

        describe('that specified path already exists and is a dir', () => {
            it('should NOT take actions', () => {
                chai.spy.on(fs, "mkdirSync");

                builder.createWorkerDir();

                expect(fs.mkdirSync).to.not.have.been.called;
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