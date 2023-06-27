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

describe.only('validateFile', () => {
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