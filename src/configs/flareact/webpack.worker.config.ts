import { Configuration } from "webpack";
import { generateWorkerCommonConfig } from "../common/webpack.worker.config";

const TMP_ENTRY_FILE = "./index.tmp.js";

const generateWorkerFlareactConfig = (outputPath: string): Configuration  => {
    const config: Configuration = generateWorkerCommonConfig();

    if (!config.output) config.output = {};
    config.output.path = outputPath;

    // Set entry
    config.entry = TMP_ENTRY_FILE;

    return config;
}

export { generateWorkerFlareactConfig };
