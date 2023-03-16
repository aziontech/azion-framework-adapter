import { mkdirSync } from 'fs';
import path from 'path';

import { ErrorCode, FailedToBuild } from '../../errors';
import { WORKER_DIR } from "../../constants";

abstract class Builder {
    targetDir: string;
    workerDir: string;

    constructor(targetDir: string) {
        this.targetDir = targetDir;
        this.workerDir = path.join(this.targetDir, WORKER_DIR);
    }

    createWorkerDir(): void {
        try {
            mkdirSync(this.workerDir, { recursive: true });
        } catch (error) {
            throw new FailedToBuild(
                this.workerDir,
                "cannot create 'worker' directory"
            );
        }
    }

    abstract build(params: any): Promise<ErrorCode>;
    abstract buildWorker(params: any): Promise<any>;
}

export { Builder }