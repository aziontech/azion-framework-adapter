
export class InvalidVersion extends Error {
    constructor(message:string) {
        super(message);
        this.name = "InvalidVersion";
    }
}