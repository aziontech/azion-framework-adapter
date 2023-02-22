import { Configuration } from "webpack";
import { generateWorkerCommonConfig } from "../common/webpack.worker.config";
import VirtualModulesPlugin from "webpack-virtual-modules";
import { KV, makeCaches } from "../../bootstraps/common";
import {
    AwsClient,
    AwsV4Signer,
    buf2hex,
    encodeRfc3986,
    guessServiceRegion,
    hash,
    hmac,
    HOST_SERVICES,
    UNSIGNABLE_HEADERS,
} from "../../libs/aws/aws4fetch";

const TMP_ENTRY_FILE = "./index.tmp.js";

const generateWorkerFlareactConfig = (outputPath: string, pluginsList: any): Configuration  => {

    pluginsList.push(
        new VirtualModulesPlugin({
            "node_modules/bootstrap.js": `module.exports = {
                encoder: ${"new TextEncoder()"},
                HOST_SERVICES: ${JSON.stringify(HOST_SERVICES)},
                UNSIGNABLE_HEADERS: ${JSON.stringify(UNSIGNABLE_HEADERS)},
                hmac: ${hmac.toString()},
                hash: ${hash.toString()},
                buf2hex: ${buf2hex.toString()},
                encodeRfc3986: ${encodeRfc3986.toString()},
                guessServiceRegion: ${guessServiceRegion.toString()},
                AwsClient: ${AwsClient.toString()},
                AwsV4Signer: ${AwsV4Signer.toString()},
                KV: ${KV.toString()},
                makeCaches: ${makeCaches.toString()},
            }`,
        })
    );

    const config: Configuration = generateWorkerCommonConfig(pluginsList);

    if (!config.output) config.output = {};
    config.output.path = outputPath;

    // Set entry
    config.entry = TMP_ENTRY_FILE;

    return config;
}

export { generateWorkerFlareactConfig };
