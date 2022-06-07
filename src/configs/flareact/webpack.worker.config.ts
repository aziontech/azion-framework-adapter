import FileManagerPlugin from "filemanager-webpack-plugin";
import { Configuration } from "webpack";
import { generateWorkerCommonConfig } from "../common/webpack.worker.config";

const ENTRY_FILE = "./index.js";
const TMP_ENTRY_FILE = "./index.tmp.js";

const generateWorkerFlareactConfig = (outputPath: string): Configuration  => {
    const config: Configuration = generateWorkerCommonConfig();

    if (!config.output) config.output = {};
    config.output.path = outputPath;

    // Set entry
    config.entry = TMP_ENTRY_FILE;

    config.plugins?.push(
        new FileManagerPlugin({
            events: {
                onStart: {
                    copy: [{ source: ENTRY_FILE, destination: TMP_ENTRY_FILE }],
                },
                onEnd: {
                    delete: [TMP_ENTRY_FILE],
                },
            },
            runTasksInSeries: true,
            runOnceInWatchMode: false,
        })
    );

    return config;
}

export { generateWorkerFlareactConfig };
