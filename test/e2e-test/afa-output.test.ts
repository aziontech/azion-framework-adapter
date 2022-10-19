import util = require('node:util');
// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const exec = util.promisify(require('node:child_process').exec);
import { expect } from 'chai';

describe('Azion Framework Adapter menu', () => {
    const stdOutput = `Usage: azion-framework-adapter [options] [command]\n
Options:
  -V, --version                             output the version number
  -h, --help                                display help for command

Commands:
  init [options] <target-dir> <repository>  Create a new project from a template.
  build [options]                           Build and upload.
  publish [options]                         Publish the application.
  help [command]                            display help for command\n`

    const initOutput = `Usage: azion-framework-adapter init [options] <target-dir> <repository>

Create a new project from a template.

Options:
  -n, --project-name <project-name>  project name
  -h, --help                         display help for command\n`

    const buildOutput = `Usage: azion-framework-adapter build [options]

Build and upload.

Options:
  -c, --config <config>         path to configuration file [default:
                                azion.json]
  -d, --assets-dir <directory>  path to static assets
  -s, --static-site             build static site function
  -h, --help                    display help for command\n`

    const publishOutput = `Usage: azion-framework-adapter publish [options]

Publish the application.

Options:
  -c, --config <config>         path to configuration file [default:
                                azion.json]
  -d, --assets-dir <directory>  path to static assets
  -e, --only-function           skip deploy of assets
  -s, --only-assets             skip deploy of Edge Function
  -h, --help                    display help for command\n`

    it('Output of "Help" option', async () => {
        const { stdout} = await exec('azion-framework-adapter --help');
        expect(stdout).to.be.equal(stdOutput)
    })

    it('Output of "Init" option', async () => {
        const { stdout} = await exec('azion-framework-adapter init --help');
        expect(stdout).to.be.equal(initOutput)
    })

    it('Output of "build" option', async () => {
        const { stdout} = await exec('azion-framework-adapter build --help');
        // console.log(stdout);
        expect(stdout).to.be.equals(buildOutput)
    })

    it('Output of "publish" option', async () => {
        const { stdout} = await exec('azion-framework-adapter publish --help');
        expect(stdout).to.be.equals(publishOutput)
    })
})