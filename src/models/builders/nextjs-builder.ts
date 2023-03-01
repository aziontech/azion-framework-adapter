import { Builder } from "./builder";
import { ErrorCode } from '../../errors';


const ERROR_MESSAGE = "Nextjs build not implemented!";

class NextjsBuilder extends Builder {
    constructor(targetDir: string) {
        super(targetDir);

        throw Error(ERROR_MESSAGE);
    }

    async build(params: any): Promise<ErrorCode> {
        console.log(params);

        throw Error(ERROR_MESSAGE);
    }

    async buildWorker(params: any): Promise<any> {
        console.log(params);

        throw Error(ERROR_MESSAGE);
    }
}

export { NextjsBuilder }