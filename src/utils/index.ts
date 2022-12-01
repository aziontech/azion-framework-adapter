import * as fs from 'fs';
import path from 'path';
import process from 'process';
import simpleGit from 'simple-git';
import util = require('node:util');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const execCommand = util.promisify(require('node:child_process').exec);

import { displayError,  errorCode,  } from "../errors";

export async function initCellsTemplate(targetDir: string, cellSiteTemplateRepo: string) {
    try {
        console.log("Creating azion directory");
        if(!fs.existsSync(path.join(targetDir,"azion"))) fs.mkdirSync(path.join(targetDir,"azion"), {recursive: true});
        process.chdir(path.join(targetDir,"azion"));

        if(fs.existsSync("cells-site-template")) fs.rmSync("cells-site-template", {recursive: true});

        console.log("Cloning template repository");
        await simpleGit().clone(cellSiteTemplateRepo, "cells-site-template");
        await simpleGit("cells-site-template").removeRemote("origin");

        process.chdir("cells-site-template/");
        console.log("Installing dependencies.");
        await execCommand("npm ci");
        console.log("All dependecies instaleds!");
    } catch (err) {
        displayError(err);
        return errorCode(err);
    }
}
