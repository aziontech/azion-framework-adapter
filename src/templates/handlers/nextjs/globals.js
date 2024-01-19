export function globalBanner() {
    return `import { AsyncLocalStorage } from "node:async_hooks";
globalThis.AsyncLocalStorage = AsyncLocalStorage;

const envAsyncLocalStorage = new AsyncLocalStorage();

globalThis.process = {
    env: {
        NODE_ENV: "production"
    }
};`;
}