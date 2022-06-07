/* tslint:disable:no-unused-expression */

import { expect } from 'chai';

import {
    BOOTSTRAP_CODE,
    buf2hex,
    encoder,
    encodeRfc3986,
    guessServiceRegion,
    hash,
    hmac,
    HOST_SERVICES,
    KV,
    makeCaches,
    UNSIGNABLE_HEADERS,
} from '../../../dist/bootstraps/common';

describe('common bootstrap', () => {
    it('should export aws client variables and functions', () => {
        const expectedObjects = [encoder, HOST_SERVICES, UNSIGNABLE_HEADERS];
        const expectedFunctions = [hmac, hash, buf2hex, encodeRfc3986, guessServiceRegion];

        expectedObjects.forEach((obj: any) => {
            expect(obj).not.to.be.undefined;
            expect(obj).to.be.instanceof(Object);
        });

        expectedFunctions.forEach((func: any) => {
            expect(func).not.to.be.undefined;
            expect(func).to.be.instanceof(Function);
        });
    });

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

