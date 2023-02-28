import { existsSync, mkdirSync, statSync } from 'fs';
import path from 'path';

import { ErrorCode, FailedToBuild } from '../../errors';


abstract class Builder {
    targetDir: string;

    constructor(targetDir: string) {
        this.targetDir = targetDir;
    }

    createWorkerDir(): void {
        const workerDir = path.join(this.targetDir, "worker");

        if (existsSync(workerDir)) {
            if (!statSync(workerDir).isDirectory()) {
                throw new FailedToBuild(
                    workerDir,
                    "cannot create 'worker' directory"
                );
            }
        } else {
            mkdirSync(workerDir);
        }
    }

    abstract build(params: any): Promise<ErrorCode>;
    abstract buildWorker(params: any): Promise<any>;
}

export { Builder }