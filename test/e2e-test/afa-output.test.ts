import util = require('node:util');
// eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
const exec = util.promisify(require('node:child_process').exec);
import { expect } from 'chai';

describe('Azion Framework Adapter menu', () => {
    const afaStdOutput = `Usage: azion-framework-adapter [options] [command]\n
Options:
  -V, --version                             output the version number
  -h, --help                                display help for command

Commands:
  init [options] <target-dir> <repository>  Create a new project from a template.
  build [options]                           Build and upload.
  publish [options]                         Publish the application.
  help [command]                            display help for command\n`

    it('Option "Help"', async () => {
        const { stdout} = await exec('azion-framework-adapter --help');
        expect(stdout).to.be.equal(afaStdOutput)
    })
})