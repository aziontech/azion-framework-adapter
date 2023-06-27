import * as chai from 'chai';

import {
	copyFileWithDir,
	normalizePath,
	readJsonFile,
	readPathsRecursively,
	validateDir,
	validateFile,
} from '../../../dist/utils/fs';

const { expect } = chai;

describe.only('normalizePath', () => {
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