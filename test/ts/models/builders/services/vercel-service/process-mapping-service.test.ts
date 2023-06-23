import * as chai from 'chai';

import type { PrerenderedFileData, VercelConfig, ProcessedVercelOutput } from '../../../../../../dist/models/builders/services/types/vercel-service-types';
import { processVercelOutput } from '../../../../../../dist/models/builders/services/vercel-service';

const { expect } = chai;

describe('process-mapping-service',()=>{
    afterEach(()=>{
        chai.spy.restore();
    });

    it('should process the config and build output correctly',()=>{
        const inputtedConfig: VercelConfig = {
			version: 3,
			routes: [
				{ src: '/test-1', dest: '/test-2' },
				{ src: '/use-middleware', middlewarePath: 'middleware' },
				{ handle: 'filesystem' },
				{ src: '/test-3', dest: '/test-4' },
				{ handle: 'miss' },
				{ src: '/test-2', dest: '/test-6' },
			],
		};
		const inputtedAssets = ['/static/test.png'];
		const inputtedPrerendered = new Map<string, PrerenderedFileData>();
		const inputtedFunctions = new Map<string, string>([
			['/middleware', '/middleware/index.js'],
			['/use-middleware', '/use-middleware/index.js'],
		]);

		const processed = processVercelOutput(
			inputtedConfig,
			inputtedAssets,
			inputtedPrerendered,
			inputtedFunctions
		);

		const expected: ProcessedVercelOutput = {
			vercelConfig: {
				version: 3,
				routes: {
					none: [
						{ src: '/test-1', dest: '/test-2' },
						{ src: '/use-middleware', middlewarePath: 'middleware' },
					],
					filesystem: [{ src: '/test-3', dest: '/test-4' }],
					miss: [{ src: '/test-2', dest: '/test-6' }],
					rewrite: [],
					resource: [],
					hit: [],
					error: [],
				},
			},
			vercelOutput: new Map([
				['/static/test.png', { type: 'static' }],
				[
					'/use-middleware',
					{
						entrypoint: '/use-middleware/index.js',
						type: 'function',
					},
				],
				[
					'middleware',
					{
						entrypoint: '/middleware/index.js',
						type: 'middleware',
					},
				],
			]),
		};

		expect(Object.keys(processed).toString()).to.equal(Object.keys(expected).toString());
        expect(Object.keys(processed.vercelConfig).toString()).to.equal(Object.keys(expected.vercelConfig).toString());
        expect(Object.keys(processed.vercelOutput).toString()).to.equal(Object.keys(expected.vercelOutput).toString());
    });
});