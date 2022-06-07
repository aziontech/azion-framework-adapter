/* tslint:disable:no-unused-expression */

import { expect } from 'chai';
import { Configuration } from 'webpack';
import { generateWorkerStaticSiteConfig } from '../../../../dist/configs/static-site/webpack.worker.config';
import path = require('path');

describe('static site worker webpack config', () => {
    let workerStaticSiteConfig: Configuration;
    before(() => {
        workerStaticSiteConfig = generateWorkerStaticSiteConfig(path.join(process.cwd(), "worker"));
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
        expect(plugins).to.include.members(['VirtualModulesPlugin', 'LimitChunkCountPlugin']);
    });

    it('should add file manager plugin with onStart copy and onEnd delete actions', () => {
        const fileManagerPlugin: any = (workerStaticSiteConfig.plugins ?? []).filter(
            (el: object) => el.constructor.name === "FileManagerPlugin"
        )[0];

        expect(fileManagerPlugin).not.to.be.undefined;
        expect(fileManagerPlugin.options.runTasksInSeries).to.be.true;

        const events = fileManagerPlugin.options.events;
        expect(events.onStart.copy).not.to.be.undefined;
        expect(events.onStart.copy).to.have.deep.members([{ source: './src/index.js', destination: './src/index.tmp.js' }]);
        expect(events.onEnd.delete).not.to.be.undefined;
        expect(events.onEnd.delete).to.have.deep.members(['./src/index.tmp.js']);
    });

    it('should add DefinePlugin with PROJECT_TYPE definition', () => {
        const definePlugin: any = (workerStaticSiteConfig.plugins ?? []).filter(
            (el: object) => el.constructor.name === "DefinePlugin"
        )[0];

        expect(definePlugin).not.to.be.undefined;
        expect(definePlugin.definitions).to.have.key('PROJECT_TYPE_PATTERN_VALUE');
    });
});



