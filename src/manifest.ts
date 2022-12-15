import * as fs from 'fs';
import * as path from 'path';
import * as xxhash from 'xxhashjs';

export interface ManifestMap {
    [key: string]: string
}

export default class ManifestBuilder {

    private jsonPath: string;
    private map: ManifestMap = {};
    private pagesPath: string;

    constructor(rootPath: string, subDir = 'out', outputJsonPath = 'worker/manifest.json') {
        this.jsonPath = path.join(rootPath, outputJsonPath);
        this.pagesPath = path.join(rootPath, subDir);
    }

    storageManifest(): ManifestMap {
        const manifest: ManifestMap = {};
        const filenames = ManifestBuilder.filenamesList(this.pagesPath);

        filenames.forEach(filename => {
            this.map[filename] = ManifestBuilder.getStoragePath(filename, fs.readFileSync(filename));
        });

        for (const filename of Object.keys(this.map)) {

            const hashPath = this.map[filename];

            // strip the 'out' directory from paths
            const manifestPath = path.relative(this.pagesPath, filename);
            const storagePath = path.relative(this.pagesPath, hashPath);

            manifest[manifestPath] = storagePath;
        }
        fs.writeFileSync(this.jsonPath, JSON.stringify(manifest, null, " "));
        console.info("Wrote manifest file to", this.jsonPath);
        return manifest;
    }

    public loadManifest(): ManifestMap {
        console.info("Loading asset manifest from", this.jsonPath);
        return require(this.jsonPath);
    }

    public static getStoragePath(filename: string, content: Buffer): string {
        const hash = xxhash.h64();
        const digest = hash.update(content).digest().toString(16).substr(0, 10);
        const ext = path.extname(filename);
        const basename = path.basename(filename, ext);
        const dirname = path.dirname(filename);
        const hashPath = path.join(dirname, `${basename}.${digest}${ext}`);
        return hashPath;
    }


    private static filenamesList(rootDirectory: string): string[] {

        const result = new Array<string>();
        function walk(directory: string, list: string[]) {
            // never step on node_modules
            if (directory !== 'node_modules') {
                for (const item of fs.readdirSync(directory, { withFileTypes: true })) {
                    if (item.isDirectory()) {
                        walk(path.join(directory, item.name), list);
                    } else if (item.isFile()) {
                        list.push(path.join(directory, item.name));
                    }
                }
            }

        }

        walk(rootDirectory, result);

        return result;

    }

}

