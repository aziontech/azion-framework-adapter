import * as fs from 'fs';
import * as path from 'path';

import { AzionApi, EdgeFunction } from './azion-api';
import AzionPublisherConfigSchema from './azion-publisher-config.schema.json';
import { validate } from './config';
import { AzionCredentialsNotSet } from './errors';

export interface AzionConfig {
    token: string,
    function_name: string,
    end_point?: string
}

export interface Config {
    azion: AzionConfig
}

export class AzionPublisher {

    private readonly args: any;
    private azion: AzionApi;
    private cfg: Config;
    private rootPath: string;

    static async getConfig(cfg: any, env: any): Promise<Config> {
        const config = await validate(cfg, AzionPublisherConfigSchema,
            'https://azion.com/azion-framework-adapter/2022-05.1/azion-publisher.schema.json');
        const azion = config.azion;
        azion.token = azion.token || env.AZION_TOKEN;
        if (!azion.token) {
            throw new AzionCredentialsNotSet();
        }
        return config;
    }

    constructor(azion: AzionApi, rootPath: string, cfg: Config) {
        const argsPath = path.join(rootPath, "./args.json");
        this.args = fs.existsSync(argsPath) ? require(argsPath) : {};
        this.azion = azion;
        this.cfg = cfg;
        this.rootPath = rootPath;
    }

    public async deployEdgeFunction(): Promise<EdgeFunction> {
        const argsPath = path.join(this.rootPath, 'worker', 'args.json');
        fs.writeFileSync(argsPath, JSON.stringify(this.args, null, " "));

        const functionPath = path.join(this.rootPath, 'worker', 'function.js');
        const functionContent = fs.readFileSync(functionPath, 'utf-8');

        const edgeFunction: EdgeFunction = {
            name: this.cfg.azion.function_name,
            code: functionContent,
            language: 'javascript',
            active: true,
            json_args: this.args
        };

        return this.azion.saveFunction(edgeFunction);
    }
}
