#!/usr/bin/env node
import { program } from 'commander';
import { exit } from 'process';
import { Builder } from './build';
import * as init from './init';
import { publish } from './publish';

// Disabling the eslint rule is cleaner than other methods for embedding the
// package version.
//
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { version } = require('../package.json');

program.version(version);

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
    .option('-v, --version-id <versionid>', 'build static site function')
    .option('-c, --config <config>', 'path to configuration file [default: azion.json]')
    .option('-d, --assets-dir <directory>', 'path to static assets')
    .option('-s, --static-site', 'build static site function')
    .action(async (options) => {
        exit(await Builder.exec(options));
    });

program
    .command('publish')
    .description('Publish the application.')
    .option('-c, --config <config>', 'path to configuration file [default: azion.json]')
    .option('-d, --assets-dir <directory>', 'path to static assets')
    .option('-e, --only-function', 'skip deploy of assets')
    .option('-s, --only-assets', 'skip deploy of Edge Function')
    .option('-t, --static-site', 'publish static site function')
    .action(async (options) => {
        if (options.onlyAssets && options.onlyFunction) {
            console.warn("-e and -s must not be used at the same time");
            exit(0);
        }
        exit(await publish(options));
    });

program.parse(process.argv);
