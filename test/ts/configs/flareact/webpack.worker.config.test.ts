/* tslint:disable:no-unused-expression */

import { expect } from 'chai';
import { Configuration } from 'webpack';
import { generateWorkerFlareactConfig } from '../../../../dist/configs/flareact/webpack.worker.config';
import path = require('path');

describe('flareact worker webpack config', () => {
    let workerFlareactConfig: Configuration;
    const pluginsList: any = [];
    before(() => {
        workerFlareactConfig = generateWorkerFlareactConfig(path.join(process.cwd(), "worker"), pluginsList);
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

    it('should add VirtualModulesPlugin with bootstrap module', () => {
        const virtualModulesPlugin: any = (workerFlareactConfig.plugins ?? []).filter(
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
});
