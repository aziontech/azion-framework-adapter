/* tslint:disable:no-unused-expression */

import { expect } from 'chai';

import {
    AwsClient,
    AwsV4Signer,
    encoder,
    HOST_SERVICES,
    UNSIGNABLE_HEADERS,
    hmac,
    hash,
    buf2hex,
    encodeRfc3986,
    guessServiceRegion,
} from '../../../../dist/libs/aws/aws4fetch';

describe('aws4fetch lib', () => {
    it('should export aws lib variables and functions', () => {
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

    it('should export AwsClient and AwsV4Signer', () => {
        const expectedClassList = [AwsClient, AwsV4Signer]

        expectedClassList.forEach((cls: any) => {
            expect(cls).not.to.be.undefined;
            expect(cls.toString()).to.match(/class/);
            expect(cls.toString()).to.match(/constructor/);
        });
    })
});