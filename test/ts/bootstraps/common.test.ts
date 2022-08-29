/* tslint:disable:no-unused-expression */

import { expect } from 'chai';

import {
    BOOTSTRAP_CODE,
    KV,
    makeCaches,
} from '../../../dist/bootstraps/common';

describe('common bootstrap', () => {
    it('should export KV class', () => {
        expect(KV).not.to.be.undefined;
        expect(KV.toString()).to.match(/class/);
        expect(KV.toString()).to.match(/constructor/);
    });

    it('should export makeCaches function', () => {
        expect(makeCaches).not.to.be.undefined;
        expect(makeCaches).to.be.instanceof(Function);
    });

    it('should export a bootstrap code with require', () => {
        expect(BOOTSTRAP_CODE).not.to.be.undefined;
        expect(typeof BOOTSTRAP_CODE).to.be.equals("string");
        expect(BOOTSTRAP_CODE).to.match(/require\("bootstrap"\)/);
    });
});

