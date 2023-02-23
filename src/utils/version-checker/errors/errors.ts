import { ErrorCode, BaseError } from "../../../errors";

export class InvalidProject extends BaseError {
    constructor(message:string) {
        super(message);
        this.name = "InvalidProject";
    }
    
    get errorCode(): ErrorCode {
        return ErrorCode.InvalidProject;
    }
}