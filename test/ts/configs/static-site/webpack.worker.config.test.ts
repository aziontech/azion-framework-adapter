/* tslint:disable:no-unused-expression */

import { expect } from 'chai';
import { Configuration } from 'webpack';
import { generateWorkerStaticSiteConfig } from '../../../../dist/configs/static-site/webpack.worker.config';
import path = require('path');

describe('static site worker webpack config', () => {
    let workerStaticSiteConfig: Configuration;
    const pluginsList: any = [];
    const versionId = "";
    before(() => {
        workerStaticSiteConfig = generateWorkerStaticSiteConfig(path.join(process.cwd(), "worker"), pluginsList, versionId);
    });

    it('should import common configs', () => {
        expect(workerStaticSiteConfig.mode).to.be.equals("production");
        expect(workerStaticSiteConfig.target).to.be.equals("webworker");
        expect(workerStaticSiteConfig.output?.path).to.be.equals(process.cwd() + "/worker");
        expect(workerStaticSiteConfig.output?.filename).to.be.equals("function.js");
        expect(workerStaticSiteConfig.output?.sourceMapFilename).to.be.equals("function.js.map");
        expect(workerStaticSiteConfig.output?.globalObject).to.be.equals("this");

        const plugins = workerStaticSiteConfig.plugins?.map(
            (plugin: object) => plugin.constructor.name
        );
        expect(plugins).to.include.members(['LimitChunkCountPlugin']);
    });

    it('should add DefinePlugin with PROJECT_TYPE definition', () => {
        const definePlugin: any = (workerStaticSiteConfig.plugins ?? []).filter(
            (el: object) => el.constructor.name === "DefinePlugin"
        )[0];

        expect(definePlugin).not.to.be.undefined;
        expect(definePlugin.definitions).to.have.keys('PROJECT_TYPE_PATTERN_VALUE','VERSION_ID');
    });
});



