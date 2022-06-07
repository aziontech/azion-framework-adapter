/* tslint:disable:no-unused-expression */

import { expect } from 'chai';
import { Configuration } from 'webpack';
import { generateWorkerFlareactConfig } from '../../../../dist/configs/flareact/webpack.worker.config';
import path = require('path');

describe('flareact worker webpack config', () => {
    let workerFlareactConfig: Configuration;
    before(() => {
        workerFlareactConfig = generateWorkerFlareactConfig(path.join(process.cwd(), "worker"));
    });

    it('should import common configs', () => {
        expect(workerFlareactConfig.mode).to.be.equals("production");
        expect(workerFlareactConfig.target).to.be.equals("webworker");
        expect(workerFlareactConfig.output?.path).to.be.equals(process.cwd() + "/worker");
        expect(workerFlareactConfig.output?.filename).to.be.equals("function.js");
        expect(workerFlareactConfig.output?.sourceMapFilename).to.be.equals("function.js.map");
        expect(workerFlareactConfig.output?.globalObject).to.be.equals("this");

        const plugins = workerFlareactConfig.plugins?.map(
            (plugin: object) => plugin.constructor.name
        );
        expect(plugins).to.include.members(['VirtualModulesPlugin', 'LimitChunkCountPlugin']);
    });

    it('should add file manager plugin with onStart copy and onEnd delete actions', () => {
        const fileManagerPlugin: any = (workerFlareactConfig.plugins ?? []).filter(
            (el: object) => el.constructor.name === "FileManagerPlugin"
        )[0];

        expect(fileManagerPlugin).not.to.be.undefined;
        expect(fileManagerPlugin.options.runTasksInSeries).to.be.true;

        const events = fileManagerPlugin.options.events;
        expect(events.onStart.copy).not.to.be.undefined;
        expect(events.onStart.copy).to.have.deep.members([{ source: './index.js', destination: './index.tmp.js' }]);
        expect(events.onEnd.delete).not.to.be.undefined;
        expect(events.onEnd.delete).to.have.deep.members(['./index.tmp.js']);
    });
});
