import path from "path";
import webpack from "webpack";
import { Configuration } from "webpack";
// import VirtualModulesPlugin from "webpack-virtual-modules";
// import { makeCaches } from "../../bootstraps/common";
// import {
//     buf2hex,
//     encodeRfc3986,
//     guessServiceRegion,
//     hash,
//     hmac,
//     HOST_SERVICES,
//     UNSIGNABLE_HEADERS,
// } from "../../libs/aws/aws4fetch";


const generateWorkerCommonConfig = (): Configuration  => {
    const pluginsList: any[] = [];

    // pluginsList.push(
    //     new VirtualModulesPlugin({
    //         "node_modules/bootstrap.js": `module.exports = {
                
    //         }`,
    //     })
    // );

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
