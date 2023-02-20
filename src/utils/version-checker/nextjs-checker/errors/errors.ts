export class InvalidNexJsVersion extends Error {
    constructor(message:string) {
        super(message);
        this.name = "InvalidVersion";
    }
}