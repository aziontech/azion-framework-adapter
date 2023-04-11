import { ErrorCode, BaseError } from "../../../errors";

export class CannotWriteFile extends BaseError{
    get errorCode():ErrorCode{
        return ErrorCode.CannotWriteFile;
    }
    constructor(message: string){
        super(`Failed while trying to write file: ${message}`);
    }
}

export class BuildedFunctionsNotFound extends BaseError{
    get errorCode():ErrorCode{
        return ErrorCode.BuildedFunctionsNotFound;
    }
    constructor(message: string){
        super(message);
    }
}
export class MiddlewareManifestHandlerError extends BaseError{
    get errorCode():ErrorCode{
        return ErrorCode.MiddlewareManifestHandlerError;
    }

    constructor(message:string){
        super(message);
    }
}

export class FailedToBuild extends BaseError{
    get errorCode():ErrorCode{
        return ErrorCode.FailedToBuild;
    }

    constructor(message:string){
        super(message);
    }
}