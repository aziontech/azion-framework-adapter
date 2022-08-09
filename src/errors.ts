/* tslint:disable:max-classes-per-file */

export enum ErrorCode {
    Ok = 0,
    Unknown = 100,
    NotADirectory = 1020,
    DirectoryNotEmpty = 1030,
    CannotCloneTemplate = 1040,
    CannotRenameTemplateProject = 1050,
    FailedToBuild = 1060,
    S3CredentialsNotSet = 1070,
    AzionCredentialsNotSet = 1080,
    NotAValidFile = 1090,
    FileNotFound = 2000,
    CannotSaveFunction = 2010,
    BuildFilesNotFound = 2042
}

export abstract class BaseError extends Error {
    abstract get errorCode(): ErrorCode;
    constructor(message: string) {
        super(message);
    }
    get [Symbol.toStringTag]() {
        return this.constructor.name;
    }
}

export class NotADirectory extends BaseError {
    get errorCode(): ErrorCode {
        return ErrorCode.NotADirectory;
    }
    constructor(path: string) {
        super(`The file is not a directory: ${path}`);
    }
}

export class DirectoryNotEmpty extends BaseError {
    get errorCode(): ErrorCode {
        return ErrorCode.DirectoryNotEmpty;
    }
    constructor(path: string) {
        super(`The directory is not empty: ${path}`);
    }
}

export class CannotCloneTemplate extends BaseError {
    get errorCode(): ErrorCode {
        return ErrorCode.CannotCloneTemplate;
    }
    constructor(path: string, reason: string) {
        super(`Cannot clone: ${path}. Because: ${reason}`);
    }
}

export class CannotRenameTemplateProject extends BaseError {
    get errorCode(): ErrorCode {
        return ErrorCode.CannotRenameTemplateProject;
    }
    constructor(path: string, reason: string) {
        super(`Cannot rename rename project. Directory: ${path}. Because: ${reason}`);
    }
}

export class FailedToBuild extends BaseError {
    get errorCode(): ErrorCode {
        return ErrorCode.FailedToBuild;
    }
    constructor(path: string, reason: string) {
        super(`Failed to build project. Directory: ${path}. Because: ${reason}`);
    }
}

export class S3CredentialsNotSet extends BaseError {
    get errorCode(): ErrorCode {
        return ErrorCode.S3CredentialsNotSet;
    }
    constructor() {
        super(`S3 credentials not set either in the configuration file or as environment variables.`);
    }
}

export class AzionCredentialsNotSet extends BaseError {
    get errorCode(): ErrorCode {
        return ErrorCode.AzionCredentialsNotSet;
    }
    constructor() {
        super(`Azion credentials not set either in the configuration file or as environment variables.`);
    }
}

export class NotAValidFile extends BaseError {
    get errorCode(): ErrorCode {
        return ErrorCode.NotAValidFile;
    }
    constructor(filename: string, reason: string) {
        super(`Couldn't read file '${filename}' at the project's root directory. Because ${reason}`);
    }
}

export class FileNotFound extends BaseError {
    get errorCode(): ErrorCode {
        return ErrorCode.FileNotFound;
    }
    constructor(filename: string) {
        super(`File not found '${filename}'`);
    }
}

export class BuildFilesNotFound extends BaseError {
    get errorCode(): ErrorCode {
        return ErrorCode.BuildFilesNotFound;
    }
    constructor(directory: string) {
        super(`Build files not found at '${directory}' directory. Please, do the build of your project before this step.`);
    }
}

export class CannotSaveFunction extends BaseError {
    get errorCode(): ErrorCode {
        return ErrorCode.CannotSaveFunction;
    }
    constructor(message: string) {
        super(`Cannot save edge function to Azion: ${message}`);
    }
}

export function displayError(err: any) {
    if (err instanceof Error) {
        console.log(err.message);
    } else {
        console.log(err);
    }
}

export function errorCode(err: any): ErrorCode {
    if (err instanceof BaseError) {
        return err.errorCode;
    } else {
        return ErrorCode.Unknown;
    }
}

