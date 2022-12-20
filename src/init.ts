import fs from 'fs';
import path from 'path';

import simpleGit from 'simple-git';
import { Err, Ok, Result } from 'ts-results';
import util = require('node:util');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const execCommand = util.promisify(require('node:child_process').exec);

import { CELLS_SITE_TEMPLATE_REPO, CELLS_SITE_TEMPLATE_WORK_DIR } from './constants';

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

async function initCellsTemplate(targetDir: string, cellSiteTemplateRepo: string) {
    try {
        console.log("Creating azion directory");
        if(!fs.existsSync("azion")) fs.mkdirSync("azion");

        const repoDir = path.join(targetDir, CELLS_SITE_TEMPLATE_WORK_DIR);
        console.log("Cloning template repository");
        await simpleGit().clone(cellSiteTemplateRepo, repoDir);
        await simpleGit(repoDir).removeRemote("origin");

        console.log("Installing dependencies.");
        await execCommand(`npm ci --prefix ${CELLS_SITE_TEMPLATE_WORK_DIR}`);
        console.log("All dependencies have been installed!");
    } catch (err) {
        displayError(err);
        return errorCode(err);
    }
}


export async function exec(targetDir: string, repository: string, options: any): Promise<ErrorCode> {
    try {
        if (options.staticSite) {
            const indexPath = path.join(targetDir, CELLS_SITE_TEMPLATE_WORK_DIR, 'src', 'index.js');
            const isInitTemplate = fs.existsSync(indexPath);
            if (!isInitTemplate) {
                await initCellsTemplate(targetDir, CELLS_SITE_TEMPLATE_REPO);
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
