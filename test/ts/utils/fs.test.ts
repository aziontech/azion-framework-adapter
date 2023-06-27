import * as chai from 'chai';
import * as fs from 'fs/promises';

import {
	copyFileWithDir,
	normalizePath,
	readJsonFile,
	readPathsRecursively,
	validateDir,
	validateFile,
} from '../../../dist/utils/fs';
import mockFs = require('mock-fs');
const { expect } = chai;

describe('normalizePath', () => {
	it('windows short path name format normalizes', () => {
		const path = 'D:\\very short path';
		const expected = 'D:/very short path';

		expect(normalizePath(path)).to.equal(expected);
	});

	it('unix path name format normalizes (no change)', () => {
		const path = '/home/unix/path';

		expect(normalizePath(path)).to.equal(path);
	});

	it('windows long path name format should not normalize', () => {
		const path = '\\\\?\\D:\\very long path';

		expect(normalizePath(path)).to.equal(path);
	});
});

describe('readJsonFile', () => {
    afterEach(()=>{
        chai.spy.restore();
    });
    
	it('should read a valid JSON file', async () => {
		const vcConfigContent = {
			runtime: 'edge',
			entrypoint: 'index.js',
		};
        chai.spy.on(fs,'readFile',(path,encoding)=>{
            return JSON.stringify(vcConfigContent)
        });

        const result = await (async()=>{
            try{
                return await readJsonFile('.vc-config.json') 
            }catch(error:any){
                return error.message
            }
        })();
		expect(result.runtime).to.equal('edge');
        expect(result.entrypoint).to.equal('index.js');
	});

	it('should return null with invalid json file', async () => {
		mockFs({
			'invalid.json': 'invalid-file',
		});
		expect(await readJsonFile('invalid.json')).to.equal(null);
		mockFs.restore();
	});
});

describe('validateFile', () => {
	beforeEach(() => {
		mockFs({
			'functions/index.func': { 'index.js': 'valid-file' },
		});
	});
	afterEach(() => {
		mockFs.restore();
	});
	it('valid file returns true', async () => {
		expect(
			await validateFile('functions/index.func/index.js')
		).to.equal(true);
	});

	it('valid directory returns false', async () => {
		expect(await validateFile('functions/index.func')).to.equal(false);
	});

	it('invalid path returns false', async () => {
		expect(
			await validateFile('functions/invalid-index.func/index.js')
		).to.equal(false);
	});
});

describe('validateDir', () => {
	beforeEach(() => {
		mockFs({
			'functions/index.func': { 'index.js': 'valid-file' },
		});
	});
	afterEach(() => {
		mockFs.restore();
	});
	it('valid directory returns true', async () => {
		mockFs({
			'functions/index.func': { 'index.js': 'valid-file' },
		});
		expect(await validateDir('functions/index.func')).to.equal(true);
		mockFs.restore();
	});

	it('valid file returns false', async () => {
		expect(await validateDir('functions/index.func/index.js')).to.equal(
			false
		);
	});

	it('invalid path returns false', async () => {
		expect(await validateDir('invalidPath')).to.equal(false);
	});
});

describe('readPathsRecursively', () => {
	beforeEach(() => {
		mockFs({
			root: {
				functions: {
					'(route-group)': {
						'page.func': {
							'index.js': 'page-js-code',
						},
					},
					'index.func': {
						'index.js': 'index-js-code',
					},
					'home.func': {
						'index.js': 'home-js-code',
					},
				},
			},
		});
	});
	afterEach(() => {
		mockFs.restore();
	});
	it('should read all paths recursively', async () => {
		const paths = (await readPathsRecursively('root/functions')).map(path =>
			normalizePath(path)
		);
		expect(paths.length).to.equal(3);
		expect(paths[0]).to.match(
			/root\/functions\/\(route-group\)\/page\.func\/index\.js$/
		);
		expect(paths[1]).to.match(/root\/functions\/home\.func\/index\.js$/);
		expect(paths[2]).to.match(/root\/functions\/index\.func\/index\.js$/);
	});
});

describe('copyFileWithDir', () => {
	it('should copy file to missing directory', async () => {
		mockFs({
			folder: {
				'index.js': 'valid-file',
			},
		});

		expect(await validateDir('new-folder')).to.equal(false);
		await copyFileWithDir('folder/index.js', 'new-folder/index.js');
		expect(await validateFile('new-folder/index.js')).to.equal(true);

		mockFs.restore();
	});

	it('should copy file to existing directory', async () => {
		mockFs({
			folder: {
				'index.js': 'valid-file',
			},
			'new-folder': {},
		});

		expect(await validateDir('new-folder')).to.equal(true);
		await copyFileWithDir('folder/index.js', 'new-folder/index.js');
		expect(await validateFile('new-folder/index.js')).to.equal(true);

		mockFs.restore();
	});
});