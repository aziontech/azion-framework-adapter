import { Configuration, DefinePlugin } from "webpack";
import { generateWorkerCommonConfig } from "../common/webpack.worker.config";

const TMP_ENTRY_FILE = "./src/index.tmp.js";

const generateWorkerStaticSiteConfig = (outputPath: string, pluginsList: any, versionId: any): Configuration  => {
    const config: Configuration = generateWorkerCommonConfig(pluginsList);

    if (!config.output) config.output = {};
    config.output.path = outputPath;

    // Set entry
    config.entry = TMP_ENTRY_FILE;

    // Add define plugin
    config.plugins?.push(
        new DefinePlugin({
            PROJECT_TYPE_PATTERN_VALUE: JSON.stringify("PROJECT_TYPE:STATIC_SITE"),
            VERSION_ID: JSON.stringify(versionId)
        })
    );

    return config;
}

export { generateWorkerStaticSiteConfig };
