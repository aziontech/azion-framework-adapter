import { cwd } from 'process';

import S3 from 'aws-sdk/clients/s3';
import { AssetPublisher, Config as AssetPublisherConfig} from './asset-publisher';
import { AzionApi } from './azion-api';
import { AzionPublisher, Config as AzionPublisherConfig } from './azion-publisher';
import { read_config } from './config';
import { displayError, ErrorCode, errorCode } from './errors';

export async function publish(options: any): Promise<ErrorCode> {

    try {
        const rawCfg = read_config(options);

        if (!options.onlyFunction) {
            const cfg: AssetPublisherConfig = await AssetPublisher.getConfig(rawCfg, process.env);
            const s3 = new S3 ({
                accessKeyId: cfg.kv.accessKeyId,
                secretAccessKey: cfg.kv.secretAccessKey,
                signatureVersion: "v4",
                s3ForcePathStyle: true
            });
            if(cfg.kv.endpoint) {
                s3.config.endpoint = cfg.kv.endpoint
            }
            const publisher = new AssetPublisher(cwd(), s3, cfg);
            await publisher.deployStaticAssets(options.assetsDir);
        }

        if (!options.onlyAssets) {
            const cfg: AzionPublisherConfig = await AzionPublisher.getConfig(rawCfg, process.env);
            const azion = await AzionApi.init(cfg.azion.end_point, cfg.azion.token);
            const publisher = new AzionPublisher(azion, cwd(), cfg);
            const deployedEdgeFunction = await publisher.deployEdgeFunction();
            console.log('Function id:', deployedEdgeFunction.id);
        }

        return ErrorCode.Ok;
    } catch (err: any) {
        displayError(err);
        if (err.statusCode === 403){
            displayError("Please check yours S3 credentials.");
        }
        return errorCode(err);
    }
}
