import * as fs from 'fs';
import * as path from 'path';

import S3 from 'aws-sdk/clients/s3';
import { validate } from './config';
import ManifestBuilder from './manifest';

import AssetPublisherConfigSchema from './asset-publisher-config.schema.json';
import { S3CredentialsNotSet } from './errors';

export interface KVConfig {
    accessKeyId: string,
    secretAccessKey: string,
    region: string,
    bucket: string,
    path: string,
    endpoint?: string
}

export interface Config {
    kv: KVConfig
}

export class AssetPublisher {

    private cfg: Config;
    private s3: S3;
    private rootPath: string;

    static async getConfig(cfg: any, env: any): Promise<Config> {
        const config = await validate(cfg, AssetPublisherConfigSchema,
            'https://azion.com/azion-framework-adapter/2022-05.1/asset-publisher-config.schema.json');
        const kv = config.kv;
        kv.accessKeyId = kv.accessKeyId ?? env.AWS_ACCESS_KEY_ID;
        kv.secretAccessKey = kv.secretAccessKey ?? env.AWS_SECRET_ACCESS_KEY;
        if (!kv.accessKeyId || !kv.secretAccessKey) {
            throw new S3CredentialsNotSet();
        }
        return config;
    }
    constructor(rootPath: string, s3: S3, cfg: Config) {
        this.cfg = cfg;
        this.rootPath = rootPath;
        this.s3 = s3;
    }

    public async deployStaticAssets(subdir = 'out') {
        const waitList = [];
        const manifest = new ManifestBuilder(this.rootPath).loadManifest();
        for (const localPath of Object.keys(manifest)) {
            const fullPath = path.join(this.rootPath, subdir, localPath);
            const content = fs.readFileSync(fullPath);
            const remotePath = ManifestBuilder.getStoragePath(localPath, content);
            const staticContentParams = {
                Bucket: this.cfg.kv.bucket,
                Key: [this.cfg.kv.path, remotePath].join('/'),
                Body: content
            };
            waitList.push(this.s3.upload(staticContentParams, {}).promise());
        }

        await Promise.all(waitList);
    }
}
