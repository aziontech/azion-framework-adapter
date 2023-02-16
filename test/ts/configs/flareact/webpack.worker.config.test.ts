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
});
