import * as fs from 'fs';
import * as jp from 'jsonpolice';
import { NotAValidFile } from './errors';

export interface KVConfig {
    accessKeyId: string,
    secretAccessKey: string,
    region: string,
    bucket: string,
    path: string
}

export interface AzionConfig {
    token: string,
    function_name: string,
    end_point?: string
}

export interface Config {
    kv: KVConfig,
    azion: AzionConfig
}

export async function validate(config: any, ConfigurationSchema: any, scope: string): Promise<any> {
    const validator = await jp.create(ConfigurationSchema, { "scope": scope });
    return validator.validate(config);
}

export function read_config(options: any): Config {
    const cfgPath = options.config ?? "azion.json";
    let config;
    try {
        config = fs.readFileSync(cfgPath, 'utf-8');
        return JSON.parse(config);
    } catch (err: any) {
        throw new NotAValidFile(cfgPath, err.message);
    }
    return config;
}
