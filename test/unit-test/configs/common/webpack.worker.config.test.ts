/* tslint:disable:no-unused-expression */

import { expect } from 'chai';
import { Configuration } from 'webpack';
import { generateWorkerCommonConfig } from '../../../../dist/configs/common/webpack.worker.config';

describe('common worker webpack config', () => {
    let workerCommonConfig: Configuration;
    before(() => {
        workerCommonConfig = generateWorkerCommonConfig();
    });

    it('should export correct build base config', () => {
        expect(workerCommonConfig.mode).to.be.equals("production");
        expect(workerCommonConfig.target).to.be.equals("webworker");
        expect(workerCommonConfig.output?.path).to.be.equals(process.cwd() + "/worker");
        expect(workerCommonConfig.output?.filename).to.be.equals("function.js");
        expect(workerCommonConfig.output?.sourceMapFilename).to.be.equals("function.js.map");
        expect(workerCommonConfig.output?.globalObject).to.be.equals("this");
    });

    it('should add VirtualModulesPlugin with bootstrap module', () => {
        const virtualModulesPlugin: any = (workerCommonConfig.plugins ?? []).filter(
            (el: object) => el.constructor.name === "VirtualModulesPlugin"
        )[0];

        expect(virtualModulesPlugin).not.to.be.undefined;
        expect(virtualModulesPlugin._staticModules).to.have.key('node_modules/bootstrap.js');

        const bootstrapVirtualModule = virtualModulesPlugin._staticModules['node_modules/bootstrap.js'];
        expect(bootstrapVirtualModule).to.match(/encoder: /);
        expect(bootstrapVirtualModule).to.match(/HOST_SERVICES: /);
        expect(bootstrapVirtualModule).to.match(/UNSIGNABLE_HEADERS: /);
        expect(bootstrapVirtualModule).to.match(/hmac: /);
        expect(bootstrapVirtualModule).to.match(/hash: /);
        expect(bootstrapVirtualModule).to.match(/buf2hex: /);
        expect(bootstrapVirtualModule).to.match(/encodeRfc3986: /);
        expect(bootstrapVirtualModule).to.match(/guessServiceRegion: /);
        expect(bootstrapVirtualModule).to.match(/AwsClient: /);
        expect(bootstrapVirtualModule).to.match(/AwsV4Signer: /);
        expect(bootstrapVirtualModule).to.match(/KV: /);
        expect(bootstrapVirtualModule).to.match(/makeCaches: /);
    });

    it('should add LimitChunkCountPlugin and set max chunks to 1', () => {
        const limitChunkCountPlugin: any = (workerCommonConfig.plugins ?? []).filter(
            (el: object) => el.constructor.name === "LimitChunkCountPlugin"
        )[0];

        expect(limitChunkCountPlugin).not.to.be.undefined;
        expect(limitChunkCountPlugin.options.maxChunks).to.be.equals(1);
    });
});

