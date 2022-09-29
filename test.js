async function run() {
    const { execa } = await import("execa");

    const { stdout } = await execa("azion-framework-adapter", ["--help"]);
    console.log(stdout)
}

run();