import * as chai from 'chai';

import { NextjsBuilder } from '../../../../dist/models/builders/nextjs-builder'


const { expect } = chai;

describe('Nextjs Builder', () => {
    it("should throw 'not implemented' error", async () => {
        const targetDir = process.cwd();

        expect(() => new NextjsBuilder(targetDir)).to.throw(
            Error, "Nextjs build not implemented!"
        );
    });
});