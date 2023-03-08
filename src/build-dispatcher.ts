import { displayError, errorCode, ErrorCode } from "./errors";
import { NextjsBuilder } from "./models/builders/nextjs-builder";


class BuildDispatcher {
    static async exec(options: any): Promise<ErrorCode> {
        try {
            const targetDir: string = process.cwd();

            const builder = new NextjsBuilder(targetDir);
            await builder.build(options);

            console.log("Completed.");

            return ErrorCode.Ok;
        } catch (err: any) {
            displayError(err);

            return errorCode(err);
        }
    }
}

export { BuildDispatcher }