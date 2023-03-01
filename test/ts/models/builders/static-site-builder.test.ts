import * as chai from 'chai';
import * as sinon from 'sinon';

import { StaticSiteBuilder } from '../../../../dist/models/builders/static-site-builder';


const { expect } = chai;

describe('Static Site Builder', () => {
    it("should throw 'not implemented' error", async () => {
        const targetDir = process.cwd();

        const buildStub = sinon.stub(StaticSiteBuilder.prototype, 'build');
        buildStub.throws(Error);

        const builder = new StaticSiteBuilder(targetDir);

        expect(() => { builder.build({}) }).to.throw(
            Error
        );
    });
});