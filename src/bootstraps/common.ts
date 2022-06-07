declare let AwsClient: any;

/**
 * AWS4FETCH
 * @npm https://www.npmjs.com/package/aws4fetch
 * @GitHub https://github.com/mhart/aws4fetch
 * @license MIT <https://opensource.org/licenses/MIT>
 * @copyright Michael Hart 2018
 */

const encoder = new TextEncoder();

interface HostServices {
    [key: string]: string
}

const HOST_SERVICES: HostServices = {
    appstream2: "appstream",
    cloudhsmv2: "cloudhsm",
    email: "ses",
    marketplace: "aws-marketplace",
    mobile: "AWSMobileHubService",
    pinpoint: "mobiletargeting",
    queue: "sqs",
    "git-codecommit": "codecommit",
    "mturk-requester-sandbox": "mturk-requester",
    "personalize-runtime": "personalize",
};

const UNSIGNABLE_HEADERS = [
    "authorization",
    "content-type",
    "content-length",
    "user-agent",
    "presigned-expires",
    "expect",
    "x-amzn-trace-id",
    "range",
    "connection",
];

async function hmac(key: any, value: string) {
    const i = typeof key === "string" ? encoder.encode(key) : key;
    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        i,
        { name: "HMAC", hash: { name: "SHA-256" } },
        false,
        ["sign"]
    );
    const s = encoder.encode(value);
    const r = await crypto.subtle.sign("HMAC", cryptoKey, s);
    return Promise.resolve(r);
}

async function hash(content: any) {
    const r = await crypto.subtle.digest(
        "SHA-256",
        typeof content === "string" ? encoder.encode(content) : content
    );
    return Promise.resolve(r);
}

function buf2hex(buffer: any) {
    return Array.prototype.map
        .call(new Uint8Array(buffer), (x) => ("0" + x.toString(16)).slice(-2))
        .join("");
}

function encodeRfc3986(urlEncodedStr: string) {
    return urlEncodedStr.replace(
        /[!'()*]/g,
        (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase()
    );
}

function guessServiceRegion(url: any, headers: any) {
    const { hostname, pathname } = url;
    const match = hostname
        .replace("dualstack.", "")
        .match(/([^.]+)\.(?:([^.]*)\.)?amazonaws\.com(?:\.cn)?$/);
    let [service, region] = (match || ["", ""]).slice(1, 3);
    if (region === "us-gov") {
        region = "us-gov-west-1";
    } else if (region === "s3" || region === "s3-accelerate") {
        region = "us-east-1";
        service = "s3";
    } else if (service === "iot") {
        if (hostname.startsWith("iot.")) {
            service = "execute-api";
        } else if (hostname.startsWith("data.jobs.iot.")) {
            service = "iot-jobs-data";
        } else {
            service = pathname === "/mqtt" ? "iotdevicegateway" : "iotdata";
        }
    } else if (service === "autoscaling") {
        const targetPrefix = (headers.get("X-Amz-Target") || "").split(".")[0];
        if (targetPrefix === "AnyScaleFrontendService") {
            service = "application-autoscaling";
        } else if (targetPrefix === "AnyScaleScalingPlannerFrontendService") {
            service = "autoscaling-plans";
        }
    } else if (region == null && service.startsWith("s3-")) {
        region = service.slice(3).replace(/^fips-|^external-1/, "");
        service = "s3";
    } else if (service.endsWith("-fips")) {
        service = service.slice(0, -5);
    } else if (region && /-\d$/.test(service) && !/-\d$/.test(region)) {
        [service, region] = [region, service];
    }

    return [HOST_SERVICES[service] || service, region];
}

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
            return undefined;
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
    encoder,
    HOST_SERVICES,
    UNSIGNABLE_HEADERS,
    hmac,
    hash,
    buf2hex,
    encodeRfc3986,
    guessServiceRegion,
    KV,
    makeCaches,
    BOOTSTRAP_CODE,
};
