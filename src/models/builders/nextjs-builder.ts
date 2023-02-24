import { Builder } from "./builder";


const ERROR_MESSAGE = "Nextjs build not implemented!";

class NextjsBuilder extends Builder {
    constructor(targetDir: string) {
        super(targetDir);

        throw Error(ERROR_MESSAGE);
    }

    async buildWorker(): Promise<any> {
        throw Error(ERROR_MESSAGE);
    }
}

export { NextjsBuilder }