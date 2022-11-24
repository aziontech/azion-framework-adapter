import fs from 'fs';
import path from 'path';

import simpleGit from 'simple-git';
import { Err, Ok, Result } from 'ts-results';
import util = require('node:util');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const execCommand = util.promisify(require('node:child_process').exec);

import {
    BaseError,
    CannotCloneTemplate,
    CannotRenameTemplateProject,
    DirectoryNotEmpty,
    displayError,
    ErrorCode,
    errorCode,
    NotADirectory
} from './errors';

const cellSiteTemplateRepo = "https://github.com/aziontech/cells-site-template.git";

function validate_target_directory(directory: string): Result<void, BaseError> {

    // A valid directory should not exist or should be an empty directory

    if (!fs.existsSync(directory)) {
        return Ok.EMPTY;
    }
    if (!fs.statSync(directory).isDirectory()) {
        return Err(new NotADirectory(directory));
    }
    if (fs.readdirSync(directory).length !== 0) {
        return Err(new DirectoryNotEmpty(directory));
    }

    return Ok.EMPTY;

}

function rename_project(targetDirPath: string, projectName: string): Result<void, BaseError> {

    try {
        const packageJsonPath = path.join(targetDirPath, "package.json");
        const content = fs.readFileSync(packageJsonPath, { encoding: 'utf-8' });
        const packageJson: any = JSON.parse(content);
        packageJson.name = projectName;
        const updatedContent = JSON.stringify(packageJson, null, "  ");
        fs.writeFileSync(packageJsonPath, updatedContent, { encoding: 'utf-8' });
    } catch (err: any) {
        return Err(new CannotRenameTemplateProject(targetDirPath, err.message));
    }

    return Ok.EMPTY;

}

async function init(targetDir: string, repository: string, options: any): Promise<Result<void, BaseError>> {

    // Normalize and convert into absolute path
    const targetDirPath = path.resolve(path.normalize(targetDir));

    // The name of the target directory is the default project name
    const defaultProjectName = path.basename(targetDirPath);

    // If user chose a different name
    const projectName = (options.projectName !== undefined) ? options.projectName : defaultProjectName;

    const result = validate_target_directory(targetDirPath);

    if (!result.ok) return result;

    try {
        await simpleGit().clone(repository, targetDir);
        await simpleGit(targetDir).removeRemote("origin");
        return rename_project(targetDirPath, projectName);
    } catch (error: any) {
        return Err(new CannotCloneTemplate(repository, error.message));
    }

}

async function initCellsTemplate(targetDir: string) {
    try {
        console.log("Creating azion directory");
        if(!fs.existsSync("azion")) fs.mkdirSync("azion");
        process.chdir(path.join(targetDir,"azion"));

        console.log("Cloning template repository");
        await simpleGit().clone(cellSiteTemplateRepo, "cells-site-template");
        await simpleGit("cells-site-template").removeRemote("origin");

        process.chdir(path.join(targetDir,"cells-site-template/"));
        console.log("installing dependencies.");
        await execCommand("npm ci");
        console.log("All dependecies instaleds!");
    } catch (err) {
        displayError(err);
        return errorCode(err);
    }
}


export async function exec(targetDir: string, repository: string, options: any): Promise<ErrorCode> {
    try {
        if(options.staticSite ) {
            const isInitTemplate = fs.existsSync(path.join(targetDir,"azion/cells-site-template/src/index.js"));
            if (!isInitTemplate) {
                await initCellsTemplate(targetDir);
            } else {
                console.log("Project already initialized!");
            }
            return ErrorCode.Ok;
        }

        const result = await init(targetDir, repository, options);
        if (result.ok) {
            console.log("Completed.");
        } else {
            console.log(result.val.message);
            return result.val.errorCode;
        }
        return ErrorCode.Ok;

    } catch (err: any) {
        displayError(err);
        return errorCode(err);
    }

}
