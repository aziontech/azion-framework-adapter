const {
  adjustRequestForVercel,
  handleRequest
} = require("./handler");

const getStorageAsset = async (request) => {
	const VERSION_ID = __VERSION_ID__;
	try {
		const requestPath = new URL(request.url).pathname;
		const asset_url = new URL(
			requestPath === "/" ?
				(VERSION_ID + '/index.html') :
				(VERSION_ID + requestPath),
			'file://'
		);

		return fetch(asset_url);
	} catch (e) {
		return new Response(e.message || e.toString(), { status: 500 })
	}
}

async function main(request, env, ctx) {
	globalThis.process.env = { ...globalThis.process.env, ...env };

	return envAsyncLocalStorage.run(
		{...env},
		async () => {
			const adjustedRequest = adjustRequestForVercel(request);
			return handleRequest(
				{
					request: adjustedRequest,
					ctx,
					assetsFetcher: env.ASSETS,
				},
				__CONFIG__,
				__BUILD_OUTPUT__
			);
		}
	);


}
addEventListener("fetch", (event) => {
	try {
		const env = {
			ASSETS: {
				fetch: getStorageAsset
			}
		};

		const context = {
			waitUntil: event.waitUntil.bind(event),
			passThroughOnException: () => null
		};
	
    const url = new URL(decodeURI(event.request.url));
    const request = new Request(url, event.request);
		
    event.respondWith(main(request, env, context));

	} catch (error) {
		console.log("Error: ")
		console.log(error)
	}
});