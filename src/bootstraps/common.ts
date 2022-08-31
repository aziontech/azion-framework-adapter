declare let AwsClient: any;

class KV {
    private aws: any;
    private bucket: string;
    private region: string;
    private path: string;

    constructor(auth: any) {
        this.aws = new AwsClient({
            accessKeyId: auth.accessKeyId,
            secretAccessKey: auth.secretAccessKey,
            region: auth.region,
            retries: 0,
        });
        this.bucket = auth.bucket;
        this.region = auth.region;
        this.path = auth.path;
    }

    async get(path: string, type: string) {
        const url = encodeURI(
            `https://${this.bucket}.s3.${this.region}.amazonaws.com/${this.path}/${path}`
        );
        const response = await this.aws.fetch(url);

        if (response.status !== 200) {
            const xmlContent = await response.text();
            const codeMatch = xmlContent.match(/<Code>(.+?)<\/Code>/);
            const messageMatch = xmlContent.match(/<Message>(.+?)<\/Message>/);

            codeMatch && messageMatch ?
                console.log("Erro:", response.status, ",", codeMatch[1],
                    ",", messageMatch[1]) :
                console.log("Erro:", xmlContent);

            return null;
        }

        if (type === "arrayBuffer") {
            const blob = await response.blob();
            const buffer = await blob.arrayBuffer();
            const byteBuffer = new Uint8Array(buffer);
            return byteBuffer;
        } else {
            const chunks = [];
            {
                if (response.body) {
                    const reader = response.body
                        .pipeThrough(new TextDecoderStream("utf-8"))
                        .getReader();
                    let { done, value } = await reader.read();
                    while (!done) {
                        chunks.push(value);
                        ({ done, value } = await reader.read());
                    }
                }
            }
            return chunks.join("");
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async put(_: any, __: any) {
        throw new Error("Unimplemented");
    }
}

const makeCaches = () => ({
    default: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async match(_: any) {
            return undefined;
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        async put(_: any, __: any) {
            return undefined;
        },
    },
});

const BOOTSTRAP_CODE = `const bootstrap = require("bootstrap"); Object.keys(bootstrap).forEach(e => { global[e] = bootstrap[e] }); global.caches = makeCaches(); global.__STATIC_CONTENT = new KV(CREDENTIALS_VALUE); global.__STATIC_CONTENT_MANIFEST = STATIC_CONTENT_MANIFEST_VALUE;`;

export {
    KV,
    makeCaches,
    BOOTSTRAP_CODE,
};
