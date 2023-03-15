import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as spies from 'chai-spies';
import * as config from '../../dist/config';

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { NotAValidFile } from '../../dist/errors';

chai.should();
chai.use(spies);
chai.use(chaiAsPromised);

describe.skip('config', () => {

    describe("read config file", () => {
        let tempDir: string;
        before(() => {
            tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'flareact-tst'));
        });

        after(() => {
            if (tempDir) {
                fs.rmdirSync(tempDir, { recursive: true });
            }
        });

        it('should read a configuration file with all parameters set', async () => {
            const tempFileComplete = path.join(tempDir, "cfg-complete.json");
            const expected = {
                kv: {
                    accessKeyId: "val1",
                    secretAccessKey: "val2",
                    bucket: "val3",
                    region: "val4",
                    path: "val5"
                },
                azion: {
                    token: "azion-personal-token",
                    function_name: 'val8'
                }
            };
            fs.writeFileSync(tempFileComplete, JSON.stringify(expected, null, " "));
            const options = { config: tempFileComplete };
            const actual = config.read_config(options);
            return actual.should.be.deep.equal(expected);
        });

        it("should complain if configuration does not exist", async () => {
            const tempFileMissing = path.join(tempDir, "cfg-not-here.json");
            const options = { config: tempFileMissing };
            (() => config.read_config(options)).should.throw(NotAValidFile);
        });
    });

});

