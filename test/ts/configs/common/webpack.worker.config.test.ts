/* tslint:disable:no-unused-expression */

import { expect } from 'chai';
import { Configuration } from 'webpack';
import { generateWorkerCommonConfig } from '../../../../dist/configs/common/webpack.worker.config';

describe('common worker webpack config', () => {
    let workerCommonConfig: Configuration;
    const pluginsList: any = [];
    before(() => {
        workerCommonConfig = generateWorkerCommonConfig(pluginsList);
    });

    it('should export correct build base config', () => {
        expect(workerCommonConfig.mode).to.be.equals("production");
        expect(workerCommonConfig.target).to.be.equals("webworker");
        expect(workerCommonConfig.output?.path).to.be.equals(process.cwd() + "/worker");
        expect(workerCommonConfig.output?.filename).to.be.equals("function.js");
        expect(workerCommonConfig.output?.sourceMapFilename).to.be.equals("function.js.map");
        expect(workerCommonConfig.output?.globalObject).to.be.equals("this");
    });

    it('should add LimitChunkCountPlugin and set max chunks to 1', () => {
        const limitChunkCountPlugin: any = (workerCommonConfig.plugins ?? []).filter(
            (el: object) => el.constructor.name === "LimitChunkCountPlugin"
        )[0];

        expect(limitChunkCountPlugin).not.to.be.undefined;
        expect(limitChunkCountPlugin.options.maxChunks).to.be.equals(1);
    });
});

