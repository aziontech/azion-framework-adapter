//This file is temporary, is just to validate a call of azion-framework-adapter in finish of workflow.
//The proper e2e test case will be written and this file will be removed.
async function run() {
    const assert = await import('node:assert');
    const { spawn } = await import('node:child_process');
    const afa =  spawn('azion-framework-adapter', ['--help']);
    const afaStdOutput = `Usage: azion-framework-adapter [options] [command]\n
Options:
  -V, --version                             output the version number
  -h, --help                                display help for command

Commands:
  init [options] <target-dir> <repository>  Create a new project from a template.
  build [options]                           Build and upload.
  publish [options]                         Publish the application.
  help [command]                            display help for command\n`
    afa.stdout.on('data', (data) => {
        assert.equal(data, afaStdOutput);
    })

    afa.stderr.on('data', (data) => {
        console.log(`Saida padrão: ${data}`)
    })

    afa.on('close', (close) => {
        console.log(`Close: ${close}`)
    })
}

run();