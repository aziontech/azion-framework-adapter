
import { expect } from 'chai';
import { clientFlareactConfig } from '../../../../dist/configs/flareact/webpack.client.config';

describe('flareact client webpack config', () => {
    it('should export correct build config', () => {
        expect(clientFlareactConfig.mode).to.be.equals("production");
    });
});

