import { ErrorCode, BaseError } from "../../../../errors";

export class InvalidNextJsVersion extends BaseError {
    constructor(message:string) {
        super(message);
        this.name = "InvalidVersion";
    }

    get errorCode(): ErrorCode {
        return ErrorCode.InvalidNextJsVersion;
    }
}