export class InvalidProject extends Error {
    constructor(message:string) {
        super(message);
        this.name = "InvalidProject";
    }
}