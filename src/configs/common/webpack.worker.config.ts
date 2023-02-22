import path from "path";
import webpack from "webpack";
import { Configuration } from "webpack";


const generateWorkerCommonConfig = (pluginsList: any): Configuration  => {

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
