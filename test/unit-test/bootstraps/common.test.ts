/* tslint:disable:no-unused-expression */
import {
    BOOTSTRAP_CODE,
    KV,
    makeCaches,
} from '../../../dist/bootstraps/common';
import { AwsClient as aws } from '../../../dist/libs/aws/aws4fetch';
import * as chai from 'chai';
import { expect } from 'chai';

declare global {
    /* eslint no-var: 0 */
    var AwsClient: typeof aws;
}

describe('common bootstrap', () => {
    describe('exports', () => {
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

    describe('KV', () => {
        let kv: KV;
        let sandbox: ChaiSpies.Sandbox;

        beforeEach(() => {
            sandbox = chai.spy.sandbox();
            sandbox.on(console, ['log']);
        });

        afterEach(() => sandbox.restore());

        before(() => {
            // runtime global available after build
            global.AwsClient = aws;

            kv = new KV({
                bucket: "azion-test",
                region: "bh",
                path: "/kombi",
                accessKeyId: "123",
                secretAccessKey: "123",
            });
        });

        describe('when AWS S3 response http status is NOT 200 (WITH code and message)', () => {
            before(() => {
                chai.spy.restore();
                chai.spy.on(kv['aws'], 'fetch', () => {
                    return {
                        status: 403,
                        text: async () => {
                            return `<?xml version="1.0" encoding="UTF-8"?>
                            <Error>
                              <Code>NoSuchKey</Code>
                              <Message>The resource you requested does not exist</Message>
                              <Resource>/azion-test/kombi/index.html</Resource>
                              <RequestId>4442587FB7D0A2F9</RequestId>
                            </Error>`
                        }
                    }
                })
            })

            it('should log an error and return null', async () => {
                const result = await kv.get('/azion-test/kombi/index.html', 'text/html');

                expect(console.log).to.have.been.called.with.exactly(
                    'Erro:', 403, ',', 'NoSuchKey', ',',
                    'The resource you requested does not exist');
                expect(result).to.be.null;
            });
        });

        describe('when AWS S3 response http status is NOT 200 (WITHOUT code and message)', () => {
            let awsS3Return: string;
            before(() => {
                awsS3Return = `<?xml version="1.0" encoding="UTF-8"?><Error>Unknown</Error>`;
                chai.spy.restore();
                chai.spy.on(kv['aws'], 'fetch', () => {
                    return {
                        status: 403,
                        text: async () => awsS3Return
                    }
                })
            })

            it('should log an error and return null', async () => {
                const result = await kv.get('/azion-test/kombi/index.html', 'text/html');

                expect(console.log).to.have.been.called.with.exactly('Erro:', awsS3Return);
                expect(result).to.be.null;
            });
        });

        describe('when AWS S3 response http status is 200 (type is arrayBuffer)', () => {
            before(() => {
                chai.spy.restore();
                chai.spy.on(kv['aws'], 'fetch', () => {
                    return {
                        status: 200,
                        blob: () => {
                            return { arrayBuffer: () => 'test' }
                        }
                    }
                })
            });

            it('should return Uint8Array result', async () => {
                const result = await kv.get('/azion-test/kombi/index.html', 'arrayBuffer');

                expect(console.log).to.not.have.been.called();
                expect(result).to.not.be.null;
                expect(result).to.be.instanceOf(Uint8Array);
            });
        });

        describe('when AWS S3 response http status is 200 (type is NOT arrayBuffer)', () => {
            before(() => {
                chai.spy.restore();
                chai.spy.on(kv['aws'], 'fetch', () => {
                    return {
                        status: 200,
                    }
                })
            });

            it('should return return text result', async () => {
                const result = await kv.get('/azion-test/kombi/index.html', 'text/html');

                expect(console.log).to.not.have.been.called();
                expect(result).to.not.be.null;
                expect(typeof result).to.be.equals('string');
            });
        });
    });
});

