import { ErrorCode } from "./errors";
import { NextjsBuilder } from "./models/builders/nextjs-builder";
import { StaticSiteBuilder } from "./models/builders/static-site-builder";


class BuildDispatcher {
    static async exec(options: any): Promise<ErrorCode> {
        try {
            const targetDir: string = process.cwd();

            if(options.staticSite){
                const builder = new StaticSiteBuilder(targetDir);
                await builder.build(options)
            } else {
                const builder = new NextjsBuilder(targetDir);
                await builder.build(options);
            }

            console.log("Completed.");

            return ErrorCode.Ok;
        } catch (err: any) {
            throw new Error(err.message);
        }
    }
}

export { BuildDispatcher }