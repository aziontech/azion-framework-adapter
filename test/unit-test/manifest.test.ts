import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as spies from 'chai-spies';

import Manifest from '../../dist/manifest';
import ManifestBuilder from '../../dist/manifest';

chai.should();
chai.use(spies);
chai.use(chaiAsPromised);

describe('manifest', () => {

    let mockupOutputPath: string;

    const directories = {
        out: {
            A: {
                A: {
                    "A.js": "Content of A.js",
                    "B.d.ts": "Content of B.d.ts",
                    "C.json": "Content of C.json",
                    "D.jpg": "Content of D.jpg"
                },
                "B.js": "Content of B.js",
                "C.d.ts": "Content of C.d.ts",
                "D.json": "Content of D.json",
                "E.jpg": "Content of E.jpg"
            },
            B: {
                "A.js": "Content of A.js",
                "B.d.ts": "Content of B.d.ts",
                "C.json": "Content of C.json",
                "D.jpg": "Content of D.jpg"
            },
            C: {}
        }
    };

    function makeDirectoryStructure(rootPath: string, directoryStructure: any) {
        for (const prop of Object.getOwnPropertyNames(directoryStructure)) {
            const item = directoryStructure[prop];
            const tp = typeof item;
            const nextPath = path.join(rootPath, prop);
            if (tp === 'object') {
                fs.mkdirSync(nextPath);
                makeDirectoryStructure(nextPath, item);
            } else {
                fs.writeFileSync(nextPath, item);
            }
        }
    }

    before(() => {
        mockupOutputPath = fs.mkdtempSync(path.join(os.tmpdir(), 'flareact-test'));
        makeDirectoryStructure(mockupOutputPath, directories);
        fs.mkdirSync(path.join(mockupOutputPath, 'worker'));
        fs.writeFileSync(path.join(mockupOutputPath, 'worker/script.js'), "Worker Code");
    });

    after(() => {
        if (mockupOutputPath) {
            fs.rmdirSync(mockupOutputPath, { recursive: true });
        }
    });

    it('should produce a correct list of paths and filenames', () => {

        const pagesPath = path.join(mockupOutputPath, 'out');

        // tslint:disable-next-line:no-string-literal
        const fileList = Manifest['filenamesList'](pagesPath);

        fileList.should.have.members([
            path.join(pagesPath, "A/A/A.js"),
            path.join(pagesPath, "A/A/B.d.ts"),
            path.join(pagesPath, "A/A/C.json"),
            path.join(pagesPath, "A/A/D.jpg"),
            path.join(pagesPath, "A/B.js"),
            path.join(pagesPath, "A/C.d.ts"),
            path.join(pagesPath, "A/D.json"),
            path.join(pagesPath, "A/E.jpg"),
            path.join(pagesPath, "B/A.js"),
            path.join(pagesPath, "B/B.d.ts"),
            path.join(pagesPath, "B/C.json"),
            path.join(pagesPath, "B/D.jpg"),
        ]);

    });

    it('should correctly produce a path with key', () => {

        const pagesPath = path.join(mockupOutputPath, 'out');

        // tslint:disable-next-line:no-string-literal
        const fileList = Manifest['filenamesList'](pagesPath);

        // tslint:disable-next-line:no-string-literal
        const storagePath = ManifestBuilder.getStoragePath(fileList[0], fs.readFileSync(fileList[0]));

        const filenameWithHash = new RegExp(path.join(pagesPath, "A/A/A.[0-9a-f]+.js"));

        storagePath.should.match(filenameWithHash);

    });


});
