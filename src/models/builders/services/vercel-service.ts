import { CannotWriteFile, VercelProjectError, VercelLoadConfigError, BuildedFunctionsNotFound } from "./errors/error";
import { mkdirSync, readFileSync, writeFileSync, existsSync, statSync} from "fs";
import { resolve } from "path";
import { execSync } from "child_process";

export class VercelService {
    detectBuildedFunctions() {
        console.log("Detecting builded functions ...");
        try {
            const functionsDir = resolve(".vercel/output/functions");
            statSync(functionsDir);
        } catch (error:any) {
            throw new BuildedFunctionsNotFound(error.message);
        }
    }

    createVercelProjectConfig() {
        console.log("Creating project config file ...");
    
        try {
            const projectConfigDir = '.vercel';
            const projectConfigFilePath = `${projectConfigDir}/project.json`;
    
            if (!existsSync(projectConfigFilePath)) {
                if (!existsSync(projectConfigDir)) {
                    mkdirSync(projectConfigDir);
                }
    
                writeFileSync(projectConfigFilePath,'{"projectId":"_","orgId":"_","settings":{}}');
            }
        } catch (error:any) {
            throw new CannotWriteFile(error.message);
        }
    }

    runVercelBuild() {
        // https://vercel.com/docs/build-output-api/v3
        console.log("Running initial build ...");

        try {
            execSync('npx --yes vercel@30.2.1 build --prod');
        } catch (error:any) {
            throw new VercelProjectError(error.message);
        }
    }

    loadVercelConfigs(): any {
        console.log("Loading configs ...")

        try {
            const fileContent = readFileSync(".vercel/output/config.json", "utf8");
            const config = JSON.parse(fileContent);

            return config;
        } catch (error:any) {
            throw new VercelLoadConfigError(error.message);
        }
    }
}