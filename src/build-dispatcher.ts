import { displayError, errorCode, ErrorCode } from "./errors";
import { NextjsBuilder } from "./models/builders/nextjs-builder";
import { StaticSiteBuilder } from "./models/builders/static-site-builder";


class BuildDispatcher {
    static async exec(options: any): Promise<ErrorCode> {
        try {
            let builder;

            const targetDir: string = process.cwd();

            if (options.staticSite) {
                builder = new StaticSiteBuilder(targetDir);
            } else {
                builder = new NextjsBuilder(targetDir);
            }

            builder.build(options);

            console.log("Completed.");

            return ErrorCode.Ok;
        } catch (err: any) {
            displayError(err);

            return errorCode(err);
        }
    }
}

export { BuildDispatcher }