import util = require('node:util');
// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const exec = util.promisify(require('node:child_process').exec);
import { expect } from 'chai';

describe('Azion Framework Adapter menu', () => {
    const stdOutput = `[options] [command]\n
Options:
  -V, --version                             output the version number
  -h, --help                                display help for command

Commands:
  init [options] [target-dir] [repository]  Create a new project from a template.
  build [options]                           Build and upload.
  help [command]                            display help for command\n`

    const azionFrameworkAdapterStdOutput = `Usage: azion-framework-adapter ${stdOutput}`;
    const azfaStdOutput = `Usage: azfa ${stdOutput}`;

    const initOutput = `Usage: azion-framework-adapter init [options] [target-dir] [repository]

Create a new project from a template.

Arguments:
  target-dir                         Target directory (default: ".")
  repository                         Repository url

Options:
  -n, --project-name <project-name>  Project name
  -s, --static-site                  Clone template to static site
  -h, --help                         display help for command\n`

    const buildOutput = `Usage: azion-framework-adapter build [options]

Build and upload.

Options:
  -c, --config <config>         path to configuration file [default:
                                azion.json]
  -d, --assets-dir <directory>  path to static assets
  -s, --static-site             build static site function
  -vid, --version-id <id>       versionId of storage-api
  -h, --help                    display help for command\n`


    it('Output of "Help" option', async () => {
        const { stdout } = await exec('azion-framework-adapter --help');
        expect(stdout).to.be.equal(azionFrameworkAdapterStdOutput);
    })

    it('Output of "Help" option (with short alias)', async () => {
        const { stdout } = await exec('azfa --help');
        expect(stdout).to.be.equal(azfaStdOutput);
    })

    it('Output of "Init" option', async () => {
        const { stdout } = await exec('azion-framework-adapter init --help');
        expect(stdout).to.be.equal(initOutput)
    })

    it('Output of "build" option', async () => {
        const { stdout } = await exec('azion-framework-adapter build --help');
        expect(stdout).to.be.equals(buildOutput)
    })

})