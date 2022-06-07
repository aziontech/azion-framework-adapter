import fs from "fs";

class BootstrapUtils {
    private entryFilePath: string;
    private bootstrapCode: string;

    constructor(entryFile: string, bootstrapCode: string) {
        this.entryFilePath = entryFile;
        this.bootstrapCode = bootstrapCode;
    }

    addBootstrap() {
        try {
            const fileContent = fs.readFileSync(this.entryFilePath, {
                encoding: "utf-8",
                flag: "r",
            });
            const alreadyHasBootstrapCode = fileContent.includes(this.bootstrapCode);

            if (!alreadyHasBootstrapCode) {
                const newFileContent = `${this.bootstrapCode}\n\n${fileContent}`;

                fs.writeFileSync(this.entryFilePath, newFileContent, {
                    encoding: "utf-8",
                    flag: "w",
                });
            }
        } catch (error) {
            console.log(`ERROR in addBootstrap: ${error}`);
        }
    }
}

export { BootstrapUtils };
