async function run() {
    // const util =  await import('node:util');
    // eslint-disable-next-line @typescript-eslint/no-var-requires, no-undef
    // const exec = util.promisify(require('node:child_process').exec);
    // const { stdout, stderr} = await exec('azion-framework-adapter --help');
    // console.log(stdout);

    const { spawn } = await import('node:child_process');
    const afa =  spawn('azion-framework-adapter', ['--help']);

    afa.stdout.on('data', (data) => {
        console.log(`${data}`)
    })

    afa.stderr.on('data', (data) => {
        console.log(`Saida padrão: ${data}`)
    })

    afa.on('close', (close) => {
        console.log(`Close: ${close}`)
    })
}

run();