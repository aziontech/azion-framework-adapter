import * as chai from 'chai';
import * as sinon from "sinon";

import { ErrorCode } from "../../dist/errors";
import { BuildDispatcher } from '../../dist/build-dispatcher';
import { StaticSiteBuilder } from '../../dist/models/builders/static-site-builder';


const { expect } = chai;

describe.skip('Build Dispatcher', () => {
    let result: ErrorCode;

    describe('when a default build process is invoked', () => {
        it('should call Nextjs build', async () => {
            const options = {};

            result = await BuildDispatcher.exec(options);

            // tmp raise not implemented error
            expect(result).to.be.equal(ErrorCode.Unknown);
        });
    });

    describe('when a static site build option is given', () => {
        it('should call Static Site build', async () => {
            const options = { staticSite: true }
            const callBuild = sinon.stub(StaticSiteBuilder.prototype, 'build');

            result = await BuildDispatcher.exec(options);
            sinon.assert.calledOnce(callBuild);
            callBuild.restore();
        });
    });

    describe('when an error occurs in the build process', () => {
        it('should log error and return error code', async () => {
            const options = { staticSite: true }
            const buildStub = sinon.stub(StaticSiteBuilder.prototype, 'build');
            buildStub.throws(Error);

            result = await BuildDispatcher.exec(options);

            expect(result).to.be.equal(100);

            buildStub.restore();
        });
    });
});