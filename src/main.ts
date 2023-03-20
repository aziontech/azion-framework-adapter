#!/usr/bin/env node
import { VersionChecker } from './utils/version-checker/version-checker';
import { program } from 'commander';
import { exit } from 'process';
import * as init from './init';
import { systemError } from "./errors";
import { BuildDispatcher } from './build-dispatcher';

// Disabling the eslint rule is cleaner than other methods for embedding the
// package version.

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../package.json');

program.version(version);

try{
    VersionChecker.node_version();
}catch(error){
    exit(systemError(error));
}

program
    .command('init')
    .argument('[target-dir]','Target directory','.')
    .argument('[repository]', 'Repository url')
    .option('-n, --project-name <project-name>', 'Project name')
    .option('-s, --static-site', 'Clone template to static site')
    .description('Create a new project from a template.')
    .action(async (targetDir, repository, options) => {
        exit(await init.exec(targetDir, repository, options));
    });

program
    .command('build')
    .description('Build and upload.')
    .option('-c, --config <config>', 'path to configuration file [default: azion.json]')
    .option('-d, --assets-dir <directory>', 'path to static assets')
    .option('-s, --static-site', 'build static site function')
    .option('-vid, --version-id <id>', 'versionId of storage-api')
    .action(async (options) => {
        exit(await BuildDispatcher.exec(options));
    });

program.parse(process.argv);