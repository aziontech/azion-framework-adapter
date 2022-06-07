import FileManagerPlugin from "filemanager-webpack-plugin";
import { Configuration, DefinePlugin } from "webpack";
import { generateWorkerCommonConfig } from "../common/webpack.worker.config";

const ENTRY_FILE = "./src/index.js";
const TMP_ENTRY_FILE = "./src/index.tmp.js";

const generateWorkerStaticSiteConfig = (outputPath: string): Configuration  => {
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

    // Add define plugin
    config.plugins?.push(
        new DefinePlugin({
            PROJECT_TYPE_PATTERN_VALUE: JSON.stringify("PROJECT_TYPE:STATIC_SITE"),
        })
    );

    return config;
}

export { generateWorkerStaticSiteConfig };
