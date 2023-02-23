export class InvalidNextJsVersion extends Error {
    constructor(message:string) {
        super(message);
        this.name = "InvalidVersion";
    }
}