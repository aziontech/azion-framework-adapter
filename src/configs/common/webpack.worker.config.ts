import path from "path";
import webpack from "webpack";
import { Configuration } from "webpack";
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


const generateWorkerCommonConfig = (): Configuration  => {
    const pluginsList: any[] = [];

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

    pluginsList.push(
        new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 1,
        })
    );

    return {
        output: {
            path: path.join(process.cwd(), "worker"),
            filename: "function.js",
            sourceMapFilename: "function.js.map",
            globalObject: "this",
        },
        mode: "production",
        plugins: pluginsList,
        target: "webworker",
    };
}

export { generateWorkerCommonConfig };
