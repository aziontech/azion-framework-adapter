import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as spies from 'chai-spies';

import path = require('path');
import * as fs from 'fs';
import { StaticSiteBuilder } from '../../../../dist/models/builders/static-site-builder';
import { before } from 'mocha';

chai.should();
chai.use(spies);
chai.use(chaiAsPromised);

const { expect } = chai;


describe('Static Site Builder', () => {
    let functionPath: string;
    let targetDir: string;
    before(() => {
        targetDir = 'out/';
        functionPath = path.join(targetDir, 'azion', 'worker', 'worker.js')
    })

    after(() => {
        fs.rmSync(path.join(targetDir,'azion'), { recursive: true });
    })
    it("should throw 'not implemented' error", async () => {
        const builder = new StaticSiteBuilder(targetDir);
        await builder.build({versionId: 'k0mb1'})
        const functionContent = fs.readFileSync(functionPath, 'utf8');
        const functionFile = fs.existsSync(functionPath);

        expect(functionContent).to.include('k0mb1');
        expect(functionFile).to.be.true;

    });
});