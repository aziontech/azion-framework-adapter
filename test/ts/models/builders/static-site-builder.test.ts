import * as chai from 'chai';

import { StaticSiteBuilder } from '../../../../dist/models/builders/static-site-builder'


const { expect } = chai;

describe('Static Site Builder', () => {
    it("should throw 'not implemented' error", async () => {
        const targetDir = process.cwd();

        expect(() => new StaticSiteBuilder(targetDir)).to.throw(
            Error, "Static Site build not implemented!"
        );
    });
});