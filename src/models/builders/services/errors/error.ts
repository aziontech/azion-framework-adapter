import { ErrorCode, BaseError } from "../../../../errors";

export class VercelProjectError extends BaseError {
    get errorCode(): ErrorCode {
        return ErrorCode.VercelProjectError ;
    }
    constructor(message: string) {
        super(`Failed while trying to build vercel project: ${message}`);
    }
}

export class VercelLoadConfigError extends BaseError{
    get errorCode():ErrorCode{
        return ErrorCode.VercelLoadConfigError;
    }
    constructor(message: string){
        super(`Failed while trying to load output project configs: ${message}`);
    }
}

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
        super(`Failed in detect builded functions: ${message}`);
    }
}

export class DirWalkError extends BaseError{
    get errorCode():ErrorCode{
        return ErrorCode.DirWalkError;
    }

    constructor(dir: string,functionsDir:string, error: any){
        super(`Failed while trying to handle dir :${dir} \nfunctionsDir: ${functionsDir} \nerror: ${error}`);
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