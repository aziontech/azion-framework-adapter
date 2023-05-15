import { ErrorCode, BaseError } from "../../../../errors";

export class VercelProjectError extends BaseError {
    get errorCode(): ErrorCode {
        return ErrorCode.VercelProjectError ;
    }
    constructor(message: string) {
        super(message);
    }
}

export class VercelLoadConfigError extends BaseError{
    get errorCode():ErrorCode{
        return ErrorCode.VercelLoadConfigError;
    }
    constructor(message: string){
        super(message);
    }
}

export class CannotWriteFile extends BaseError{
    get errorCode():ErrorCode{
        return ErrorCode.CannotWriteFile;
    }
    constructor(message: string){
        super(message);
    }
}

export class BuildedFunctionsNotFound extends BaseError{
    get errorCode():ErrorCode{
        return ErrorCode.BuildedFunctionsNotFound;
    }
    constructor(message: string){
        super(`Failed in detect builded functions: ${message}`);
    }
}

export class MiddlewareManifestHandlerError extends BaseError{
    get errorCode():ErrorCode{
        return ErrorCode.MiddlewareManifestHandlerError;
    }

    constructor(error:any){
        super(`Middleware handler got an error while parsing manifest: ${error} `);
    }
}


export class VcConfigError extends BaseError{
    get errorCode():ErrorCode{
        return ErrorCode.Unknown;
    }

    constructor(invalidFunctions: string){
        super(`This project is not an edge project\nMake sure that following files have a correct configuration about edge runtime\n`+
        `\n`+
        `${invalidFunctions}`+
        `\n`+
        `\n`+
        `Maybe this links can help you\n`+
        `https://nextjs.org/docs/app/building-your-application/rendering/edge-and-nodejs-runtimes#segment-runtime-option\n`+
        `https://nextjs.org/docs/pages/building-your-application/routing/api-routes#edge-api-routes\n`);
    }
}