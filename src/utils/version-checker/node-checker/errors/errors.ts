import { ErrorCode, BaseError } from "../../../../errors";

export class InvalidVersion extends BaseError {
    constructor(message:string) {
        super(message);
        this.name = "InvalidVersion";
    }

    get errorCode(): ErrorCode {
        return ErrorCode.InvalidVersion;
    }
}