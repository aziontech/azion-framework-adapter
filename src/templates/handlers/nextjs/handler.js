// this code is based on cf build next tool (https://github.com/cloudflare/next-on-pages)

// TODO: extract sections ([START] ----- [END]) to modules ! =D

// [START] COOKIE lib ----------------------------------------------------------------
/*!
 * cookie
 * Copyright(c) 2012-2014 Roman Shtylman
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */

/**
 * Module variables.
 * @private
 */

const __toString = Object.prototype.toString

/**
 * RegExp to match field-content in RFC 7230 sec 3.2
 *
 * field-content = field-vchar [ 1*( SP / HTAB ) field-vchar ]
 * field-vchar   = VCHAR / obs-text
 * obs-text      = %x80-FF
 */

const fieldContentRegExp = /^[\u0009\u0020-\u007e\u0080-\u00ff]+$/;

/**
 * Parse a cookie header.
 *
 * Parse the given cookie header string into an object
 * The object has the various cookies as keys(names) => values
 *
 * @param {string} str
 * @param {object} [options]
 * @return {object}
 * @public
 */

const parse = (str, options) => {
	if (typeof str !== 'string') {
		throw new TypeError('argument str must be a string');
	}

	var obj = {}
	var opt = options || {};
	var dec = opt.decode || decode;

	var index = 0
	while (index < str.length) {
		var eqIdx = str.indexOf('=', index)

		// no more cookie pairs
		if (eqIdx === -1) {
			break
		}

		var endIdx = str.indexOf(';', index)

		if (endIdx === -1) {
			endIdx = str.length
		} else if (endIdx < eqIdx) {
			// backtrack on prior semicolon
			index = str.lastIndexOf(';', eqIdx - 1) + 1
			continue
		}

		var key = str.slice(index, eqIdx).trim()

		// only assign once
		if (undefined === obj[key]) {
			var val = str.slice(eqIdx + 1, endIdx).trim()

			// quoted values
			if (val.charCodeAt(0) === 0x22) {
				val = val.slice(1, -1)
			}

			obj[key] = tryDecode(val, dec);
		}

		index = endIdx + 1
	}

	return obj;
}

/**
 * Serialize data into a cookie header.
 *
 * Serialize the a name value pair into a cookie string suitable for
 * http headers. An optional options object specified cookie parameters.
 *
 * serialize('foo', 'bar', { httpOnly: true })
 *   => "foo=bar; httpOnly"
 *
 * @param {string} name
 * @param {string} val
 * @param {object} [options]
 * @return {string}
 * @public
 */

const serialize = (name, val, options) => {
	var opt = options || {};
	var enc = opt.encode || encode;

	if (typeof enc !== 'function') {
		throw new TypeError('option encode is invalid');
	}

	if (!fieldContentRegExp.test(name)) {
		throw new TypeError('argument name is invalid');
	}

	var value = enc(val);

	if (value && !fieldContentRegExp.test(value)) {
		throw new TypeError('argument val is invalid');
	}

	var str = name + '=' + value;

	if (null != opt.maxAge) {
		var maxAge = opt.maxAge - 0;

		if (isNaN(maxAge) || !isFinite(maxAge)) {
			throw new TypeError('option maxAge is invalid')
		}

		str += '; Max-Age=' + Math.floor(maxAge);
	}

	if (opt.domain) {
		if (!fieldContentRegExp.test(opt.domain)) {
			throw new TypeError('option domain is invalid');
		}

		str += '; Domain=' + opt.domain;
	}

	if (opt.path) {
		if (!fieldContentRegExp.test(opt.path)) {
			throw new TypeError('option path is invalid');
		}

		str += '; Path=' + opt.path;
	}

	if (opt.expires) {
		var expires = opt.expires

		if (!isDate(expires) || isNaN(expires.valueOf())) {
			throw new TypeError('option expires is invalid');
		}

		str += '; Expires=' + expires.toUTCString()
	}

	if (opt.httpOnly) {
		str += '; HttpOnly';
	}

	if (opt.secure) {
		str += '; Secure';
	}

	if (opt.priority) {
		var priority = typeof opt.priority === 'string'
			? opt.priority.toLowerCase()
			: opt.priority

		switch (priority) {
			case 'low':
				str += '; Priority=Low'
				break
			case 'medium':
				str += '; Priority=Medium'
				break
			case 'high':
				str += '; Priority=High'
				break
			default:
				throw new TypeError('option priority is invalid')
		}
	}

	if (opt.sameSite) {
		var sameSite = typeof opt.sameSite === 'string'
			? opt.sameSite.toLowerCase() : opt.sameSite;

		switch (sameSite) {
			case true:
				str += '; SameSite=Strict';
				break;
			case 'lax':
				str += '; SameSite=Lax';
				break;
			case 'strict':
				str += '; SameSite=Strict';
				break;
			case 'none':
				str += '; SameSite=None';
				break;
			default:
				throw new TypeError('option sameSite is invalid');
		}
	}

	return str;
}

/**
 * URL-decode string value. Optimized to skip native call when no %.
 *
 * @param {string} str
 * @returns {string}
 */

const decode = (str) => {
	return str.indexOf('%') !== -1
		? decodeURIComponent(str)
		: str
}

/**
 * URL-encode value.
 *
 * @param {string} str
 * @returns {string}
 */

const encode = (val) => {
	return encodeURIComponent(val)
}

/**
 * Determine if value is a Date.
 *
 * @param {*} val
 * @private
 */

const isDate = (val) => {
	return __toString.call(val) === '[object Date]' ||
		val instanceof Date
}

/**
 * Try decoding a string using a decoding function.
 *
 * @param {string} str
 * @param {function} decode
 * @private
 */

const tryDecode = (str, decode) => {
	try {
		return decode(str);
	} catch (e) {
		return str;
	}
}
// [END] COOKIE lib ----------------------------------------------------------------

// [START] pcre-to-regexp lib --------------------------------------------------------

// lib https://github.com/TooTallNate/pcre-to-regexp

/**
 * Returns a JavaScript RegExp instance from the given PCRE-compatible string.
 * Flags may be passed in after the final delimiter in the `format` string.
 *
 * An empty array may be passsed in as the second argument, which will be
 * populated with the "named capture group" names as Strings in the Array,
 * once the RegExp has been returned.
 *
 * @param {String} pattern - PCRE regexp string to compile to a JS RegExp
 * @param {Array} [namedCaptures] - optional empty array, which will be populated with the named captures extracted from the PCRE regexp
 * @return {RegExp} returns a JavaScript RegExp instance from the given `pattern` and optionally `flags`
 * @public
 */
function createPCRE(pattern, namedCaptures) {
	pattern = String(pattern || '').trim();
	let originalPattern = pattern;
	let delim;
	let flags = '';
	// A delimiter can be any non-alphanumeric, non-backslash,
	// non-whitespace character.
	let hasDelim = /^[^a-zA-Z\\\s]/.test(pattern);
	if (hasDelim) {
		delim = pattern[0];
		let lastDelimIndex = pattern.lastIndexOf(delim);
		// pull out the flags in the pattern
		flags += pattern.substring(lastDelimIndex + 1);
		// strip the delims from the pattern
		pattern = pattern.substring(1, lastDelimIndex);
	}
	// populate namedCaptures array and removed named captures from the `pattern`
	let numGroups = 0;
	pattern = replaceCaptureGroups(pattern, (group) => {
		if (/^\(\?[P<']/.test(group)) {
			// PCRE-style "named capture"
			// It is possible to name a subpattern using the syntax (?P<name>pattern).
			// This subpattern will then be indexed in the matches array by its normal
			// numeric position and also by name. PHP 5.2.2 introduced two alternative
			// syntaxes (?<name>pattern) and (?'name'pattern).
			let match = /^\(\?P?[<']([^>']+)[>']/.exec(group);
			if (!match) {
				throw new Error(`Failed to extract named captures from ${JSON.stringify(group)}`);
			}
			let capture = group.substring(match[0].length, group.length - 1);
			if (namedCaptures) {
				namedCaptures[numGroups] = match[1];
			}
			numGroups++;
			return `(${capture})`;
		}
		if (group.substring(0, 3) === '(?:') {
			// non-capture group, leave untouched
			return group;
		}
		// regular capture, leave untouched
		numGroups++;
		return group;
	});
	// replace "character classes" with their raw RegExp equivalent
	pattern = pattern.replace(/\[:([^:]+):\]/g, (characterClass, name) => {
		return createPCRE.characterClasses[name] || characterClass;
	});
	// TODO: convert PCRE-only flags to JS
	// TODO: handle lots more stuff....
	// http://www.php.net/manual/en/reference.pcre.pattern.syntax.php
	return new createPCRE.PCRE(pattern, flags, originalPattern, flags, delim);
}
/**
* Invokes `fn` for each "capture group" encountered in the PCRE `pattern`,
* and inserts the returned value into the pattern instead of the capture
* group itself.
*
* @private
*/
function replaceCaptureGroups(pattern, fn) {
	let start = 0;
	let depth = 0;
	let escaped = false;
	for (let i = 0; i < pattern.length; i++) {
		let cur = pattern[i];
		if (escaped) {
			// skip this letter, it's been escaped
			escaped = false;
			continue;
		}
		switch (cur) {
			case '(':
				// we're only interested in groups when the depth reaches 0
				if (depth === 0) {
					start = i;
				}
				depth++;
				break;
			case ')':
				if (depth > 0) {
					depth--;
					// we're only interested in groups when the depth reaches 0
					if (depth === 0) {
						let end = i + 1;
						let l = start === 0 ? '' : pattern.substring(0, start);
						let r = pattern.substring(end);
						let v = String(fn(pattern.substring(start, end)));
						pattern = l + v + r;
						i = start;
					}
				}
				break;
			case '\\':
				escaped = true;
				break;
			default:
				// skip
				break;
		}
	}
	return pattern;
}
(function (createPCRE) {
	class PCRE extends RegExp {
		constructor(pattern, flags, pcrePattern, pcreFlags, delimiter) {
			super(pattern, flags);
			this.pcrePattern = pcrePattern;
			this.pcreFlags = pcreFlags;
			this.delimiter = delimiter;
		}
	}
	createPCRE.PCRE = PCRE;
	/**
	 * Mapping of "character class" names to their JS RegExp equivalent.
	 * So that /[:digit:]/ gets converted into /\d/, etc.
	 *
	 * See: http://en.wikipedia.org/wiki/Regular_expression#Character_classes
	 */
	createPCRE.characterClasses = {
		alnum: '[A-Za-z0-9]',
		word: '[A-Za-z0-9_]',
		alpha: '[A-Za-z]',
		blank: '[ \\t]',
		cntrl: '[\\x00-\\x1F\\x7F]',
		digit: '\\d',
		graph: '[\\x21-\\x7E]',
		lower: '[a-z]',
		print: '[\\x20-\\x7E]',
		punct: '[\\]\\[!"#$%&\'()*+,./:;<=>?@\\\\^_`{|}~-]',
		space: '\\s',
		upper: '[A-Z]',
		xdigit: '[A-Fa-f0-9]'
	};
})(createPCRE || (createPCRE = {}));
createPCRE.prototype = createPCRE.PCRE.prototype;

// [END] pcre-to-regexp lib --------------------------------------------------------

// [START] UTILS ---------------------------------------------------------------------

// http
/**
 * Applies a set of headers to a response.
 *
 * @param target Headers object to apply to.
 * @param source Headers to apply.
 * @param pcreMatch PCRE match result to apply to header values.
 */
function applyHeaders(
	target, source, pcreMatch
) {
	const entries =
		source instanceof Headers ? source.entries() : Object.entries(source);
	for (const [key, value] of entries) {
		target.set(
			key.toLowerCase(),
			pcreMatch?.match
				? applyPCREMatches(value, pcreMatch.match, pcreMatch.captureGroupKeys)
				: value
		);
	}
}

/**
 * Checks if a string is an URL.
 *
 * @param url String to check.
 * @returns Whether the string is an URL.
 */
function isUrl(url) {
	return /^https?:\/\//.test(url);
}

/**
 * Merges search params from one URLSearchParams object to another.
 *
 * Only updates the a parameter if the target does not contain it, or the source value is not empty.
 *
 * @param target Target that search params will be applied to.
 * @param source Source search params to apply to the target.
 */
function applySearchParams(
	target, source
) {
	for (const [key, value] of source.entries()) {
		if (!target.has(key) || !!value) {
			target.set(key, value);
		}
	}
}

/**
 * Creates a new Request object with the same body, headers, and search params as the original.
 *
 * Replaces the URL with the given path, stripping the `.html` extension and `/index.html` for
 * asset matching.
 * https://developers.cloudflare.com/pages/platform/serving-pages/#route-matching
 *
 * @param req Request object to re-create.
 * @param path URL to use for the new Request object.
 * @returns A new Request object with the same body and headers as the original.
 */
function createRouteRequest(req, path) {
	const newUrl = new URL(path, req.url);
	applySearchParams(newUrl.searchParams, new URL(req.url).searchParams);

	newUrl.pathname = newUrl.pathname
		.replace(/^\/index.html$/, '/')
		.replace(/\.html$/, '');

	return new Request(newUrl, req);
}

/**
 * Creates a new Response object with the same body and headers as the original.
 *
 * Useful when the response object may be immutable.
 *
 * @param resp Response object to re-create.
 * @returns A new Response object with the same body and headers.
 */
function createMutableResponse(resp) {
	return new Response(resp.body, resp);
}

/**
 * Parses the Accept-Language header value and returns an array of locales sorted by quality.
 *x
 * @param headerValue Accept-Language header value.
 * @returns Array of locales sorted by quality.
 */
function parseAcceptLanguage(headerValue) {
	return headerValue
		.split(',')
		.map(val => {
			const [lang, qual] = val.split(';')
			const quality = parseFloat((qual ?? 'q=1').replace(/q *= */gi, ''));

			return [lang.trim(), isNaN(quality) ? 1 : quality];
		})
		.sort((a, b) => b[1] - a[1])
		.map(([locale]) => (locale === '*' || locale === '' ? [] : locale))
		.flat();
}

// matcher
/**
 * Checks if a Vercel source route's `has` record conditions match a request.
 *
 * @param has The `has` record conditions to check against the request.
 * @param requestProperties The request properties to check against.
 * @returns Whether the request matches the `has` record conditions.
 */
function hasField(
	has,
	{ url, cookies, headers }
) {
	switch (has.type) {
		case 'host': {
			return url.hostname === has.value;
		}
		case 'header': {
			if (has.value !== undefined) {
				return !!headers.get(has.key)?.match(has.value);
			}

			return headers.has(has.key);
		}
		case 'cookie': {
			const cookie = cookies[has.key];

			if (has.value !== undefined) {
				return !!cookie?.match(has.value);
			}

			return cookie !== undefined;
		}
		case 'query': {
			if (has.value !== undefined) {
				return !!url.searchParams.get(has.key)?.match(has.value);
			}

			return url.searchParams.has(has.key);
		}
	}
}

// pcre
// pcre-to-regexp converts a PCRE string to a regular expression. It also extracts the named
// capture group keys, which is useful for matching and replacing parameters.
// This is the same library used by Vercel in the build output, and is used here to ensure
// consistency and proper support.

/**
 * Checks if a value matches with a PCRE-compatible string, and extract the capture group keys.
 *
 * @param expr PCRE-compatible string.
 * @param val String to check with the regular expression.
 * @param caseSensitive Whether the regular expression should be case sensitive.
 * @returns The result of the matcher and the named capture group keys.
 */
function matchPCRE(
	expr,
	val,
	caseSensitive
) {
	const flag = caseSensitive ? '' : 'i';
	const captureGroupKeys = [];

	const matcher = createPCRE(`%${expr}%${flag}`, captureGroupKeys);
	const match = matcher.exec(val);

	return { match, captureGroupKeys };
}

/**
 * Processes the value and replaced any matched parameters (index or named capture groups).
 *
 * @param rawStr String to process.
 * @param match Matches from the PCRE matcher.
 * @param captureGroupKeys Named capture group keys from the PCRE matcher.
 * @returns The processed string with replaced parameters.
 */
function applyPCREMatches(
	rawStr,
	match,
	captureGroupKeys
) {
	return rawStr.replace(/\$([a-zA-Z0-9]+)/g, (_, key) => {
		const index = captureGroupKeys.indexOf(key);
		// If the extracted key does not exist as a named capture group from the matcher, we can
		// reasonably assume it's a number and return the matched index. Fallback to an empty string.
		return (index === -1 ? match[parseInt(key, 10)] : match[index + 1]) || '';
	});
}

// request
/**
 * Adjusts the request so that it is formatted as if it were provided by Vercel
 *
 * @param request the original request received by the worker
 * @returns the adjusted request to pass to Next
 */
function adjustRequestForVercel(request) {
	const adjustedHeaders = new Headers(request.headers);

	if (request.cf) {
		// TODO: replace cf geoip infos with azion metadata
		adjustedHeaders.append('x-vercel-ip-city', "request.cf.city");
		adjustedHeaders.append('x-vercel-ip-country', "request.cf.country");
		adjustedHeaders.append(
			'x-vercel-ip-country-region',
			"request.cf.region"
		);
		adjustedHeaders.append(
			'x-vercel-ip-latitude',
			"request.cf.latitude"
		);
		adjustedHeaders.append(
			'x-vercel-ip-longitude',
			"request.cf.longitude"
		);
	}

	return new Request(request, { headers: adjustedHeaders });
}

// routing
/**
 * Gets the next phase of the routing process.
 *
 * Determines which phase should follow the `none`, `filesystem`, `rewrite`, or `resource` phases.
 * Falls back to `miss`.
 *
 * @param phase Current phase of the routing process.
 * @returns Next phase of the routing process.
 */
function getNextPhase(phase) {
	switch (phase) {
		// `none` applied headers/redirects/middleware/`beforeFiles` rewrites. It checked non-dynamic routes and static assets.
		case 'none': {
			return 'filesystem';
		}
		// `filesystem` applied `afterFiles` rewrites. It checked those rewritten routes.
		case 'filesystem': {
			return 'rewrite';
		}
		// `rewrite` applied dynamic params to requests. It checked dynamic routes.
		case 'rewrite': {
			return 'resource';
		}
		// `resource` applied `fallback` rewrites. It checked the final routes.
		case 'resource': {
			return 'miss';
		}
		default: {
			return 'miss';
		}
	}
}

/**
 * Runs or fetches a build output item.
 *
 * @param item Build output item to run or fetch.
 * @param request Request object.
 * @param match Matched route details.
 * @param assets Fetcher for static assets.
 * @param ctx Execution context for the request.
 * @returns Response object.
 */
async function runOrFetchBuildOutputItem(
	item,
	{ request, assetsFetcher, ctx },
	{ path, searchParams }
) {
	let resp = undefined;

	// Apply the search params from matching the route to the request URL.
	const url = new URL(request.url);
	applySearchParams(url.searchParams, searchParams);
	const req = new Request(url, request);

	try {
		switch (item?.type) {
			case 'function':
			case 'middleware': {
				// TODO: check other examples (rsc, app router, ...)
				const edgeFunction = item.entrypoint;
				resp = await edgeFunction.default(req, ctx);
				break;
			}
			case 'override': {
				// TODO: check override actions
				resp = createMutableResponse(
					await assetsFetcher.fetch(createRouteRequest(req, item.path ?? path))
				);

				if (item.headers) {
					applyHeaders(resp.headers, item.headers);
				}
				break;
			}
			case 'static': {
				// TODO - Use azion format to get assets
				resp = await assetsFetcher.fetch(createRouteRequest(req, path));
				break;
			}
			default: {
				resp = new Response('Not Found', { status: 404 });
			}
		}
	} catch (e) {
		// eslint-disable-next-line no-console
		console.error(e);
		return new Response('Internal Server Error', { status: 500 });
	}

	return createMutableResponse(resp);
}

// [END] UTILS ---------------------------------------------------------------------

// [START] Routes matcher ------------------------------------------------------------
/**
 * The routes matcher is used to match a request to a route and run the route's middleware.
 */
class RoutesMatcher {
	/**
	 * Creates a new instance of a request matcher.
	 *
	 * The matcher is used to match a request to a route and run the route's middleware.
	 *
	 * @param routes The processed Vercel build output config routes.
	 * @param output Vercel build output.
	 * @param reqCtx Request context object; request object, assets fetcher, and execution context.
	 * @param prevMatch The previous match from a routing phase to initialize the matcher with.
	 * @returns The matched set of path, status, headers, and search params.
	 */
	constructor(
		/** Processed routes from the Vercel build output config. */
		routes,
		/** Vercel build output. */
		output,
		/** Request Context object for the request to match */
		reqCtx,
		prevMatch
	) {
		this.routes = routes;
		this.output = output;
		this.reqCtx = reqCtx;
		this.url = new URL(reqCtx.request.url);
		this.cookies = parse(reqCtx.request.headers.get('cookie') || '');

		this.path = prevMatch?.path || this.url.pathname || '/';
		this.status = prevMatch?.status;
		this.headers = prevMatch?.headers || {
			normal: new Headers(),
			important: new Headers(),
		};
		this.searchParams = prevMatch?.searchParams || new URLSearchParams();
		applySearchParams(this.searchParams, this.url.searchParams);

		this.checkPhaseCounter = 0;
	}

	/**
	 * Checks if a Vercel source route from the build output config matches the request.
	 *
	 * @param route Build output config source route.
	 * @param checkStatus Whether to check the status code of the route.
	 * @returns The source path match result if the route matches, otherwise `undefined`.
	 */
	checkRouteMatch(
		route,
		checkStatus
	) {
		const srcMatch = matchPCRE(route.src, this.path, route.caseSensitive);
		if (!srcMatch.match) return;

		// One of the HTTP `methods` conditions must be met - skip if not met.
		if (
			route.methods &&
			!route.methods
				.map(m => m.toUpperCase())
				.includes(this.reqCtx.request.method.toUpperCase())
		) {
			return;
		}

		const hasFieldProps = {
			url: this.url,
			cookies: this.cookies,
			headers: this.reqCtx.request.headers,
		};

		// All `has` conditions must be met - skip if one is not met.
		if (route.has?.find(has => !hasField(has, hasFieldProps))) {
			return;
		}

		// All `missing` conditions must not be met - skip if one is met.
		if (route.missing?.find(has => hasField(has, hasFieldProps))) {
			return;
		}

		// Required status code must match (i.e. for error routes) - skip if not met.
		if (checkStatus && route.status !== this.status) {
			return;
		}

		return srcMatch;
	}

	/**
	 * Processes the response from running a middleware function.
	 *
	 * Handles rewriting the URL and applying redirects, response headers, and overriden request headers.
	 *
	 * @param resp Middleware response object.
	 */
	processMiddlewareResp(resp) {
		const overrideKey = 'x-middleware-override-headers';
		const overrideHeader = resp.headers.get(overrideKey);
		if (overrideHeader) {
			const overridenHeaderKeys = new Set(
				overrideHeader.split(',').map(h => h.trim())
			);

			for (const key of overridenHeaderKeys.keys()) {
				const valueKey = `x-middleware-request-${key}`;
				const value = resp.headers.get(valueKey);

				if (this.reqCtx.request.headers.get(key) !== value) {
					if (value) {
						this.reqCtx.request.headers.set(key, value);
					} else {
						this.reqCtx.request.headers.delete(key);
					}
				}

				resp.headers.delete(valueKey);
			}

			resp.headers.delete(overrideKey);
		}

		const rewriteKey = 'x-middleware-rewrite';
		const rewriteHeader = resp.headers.get(rewriteKey);
		if (rewriteHeader) {
			const newUrl = new URL(rewriteHeader, this.url);
			this.path = newUrl.pathname;
			applySearchParams(this.searchParams, newUrl.searchParams);

			resp.headers.delete(rewriteKey);
		}

		applyHeaders(this.headers.normal, resp.headers);
	}

	/**
	 * Runs the middleware function for a route if it exists.
	 *
	 * @param path Path to the route's middleware function.
	 * @returns Whether the middleware function was run successfully.
	 */
	async runRouteMiddleware(path) {
		// If there is no path, return true as it did not result in an error.
		if (!path) return true;

		const item = path && this.output[path];
		if (!item || item.type !== 'middleware') {
			// The middleware function could not be found. Set the status to 500 and bail out.
			this.status = 500;
			return false;
		}

		const resp = await runOrFetchBuildOutputItem(item, this.reqCtx, {
			path: this.path,
			searchParams: this.searchParams,
			headers: this.headers,
			status: this.status,
		});

		if (resp.status >= 400) {
			// The middleware function errored. Set the status and bail out.
			this.status = resp.status;
			return false;
		}

		this.processMiddlewareResp(resp);
		return true;
	}

	/**
	 * Resets the response status and headers if the route should override them.
	 *
	 * @param route Build output config source route.
	 */
	applyRouteOverrides(route) {
		if (!route.override) return;

		this.status = undefined;
		this.headers.normal = new Headers();
		this.headers.important = new Headers();
	}

	/**
	 * Applies the route's headers for the response object.
	 *
	 * @param route Build output config source route.
	 * @param srcMatch Matches from the PCRE matcher.
	 * @param captureGroupKeys Named capture group keys from the PCRE matcher.
	 */
	applyRouteHeaders(
		route,
		srcMatch,
		captureGroupKeys
	) {
		if (!route.headers) return;

		applyHeaders(this.headers.normal, route.headers, {
			match: srcMatch,
			captureGroupKeys,
		});

		if (route.important) {
			applyHeaders(this.headers.important, route.headers, {
				match: srcMatch,
				captureGroupKeys,
			});
		}
	}

	/**
	 * Applies the route's status code for the response object.
	 *
	 * @param route Build output config source route.
	 */
	applyRouteStatus(route) {
		if (!route.status) return;

		this.status = route.status;
	}

	/**
	 * Applies the route's destination for the matching the path to the Vercel build output.
	 *
	 * @param route Build output config source route.
	 * @param srcMatch Matches from the PCRE matcher.
	 * @param captureGroupKeys Named capture group keys from the PCRE matcher.
	 * @returns The previous path for the route before applying the destination.
	 */
	applyRouteDest(
		route,
		srcMatch,
		captureGroupKeys
	) {
		if (!route.dest) return this.path;

		const prevPath = this.path;

		this.path = applyPCREMatches(route.dest, srcMatch, captureGroupKeys);

		// NOTE: Special handling for `/index` RSC routes. Sometimes the Vercel build output config
		// has a record to rewrite `^/` to `/index.rsc`, however, this will hit requests to pages
		// that aren't `/`. In this case, we should check that the previous path is `/`.
		if (/\/index\.rsc$/i.test(this.path) && !/\/(?:index)?$/i.test(prevPath)) {
			this.path = prevPath;
		}

		// NOTE: Special handling for `.rsc` requests. If the Vercel CLI failed to generate an RSC
		// version of the page and the build output config has a record mapping the request to the
		// RSC variant, we should strip the `.rsc` extension from the path.
		const isRsc = /\.rsc$/i.test(this.path);
		const pathExistsInOutput = this.path in this.output;
		if (isRsc && !pathExistsInOutput) {
			this.path = this.path.replace(/\.rsc/i, '');
		}

		// Merge search params for later use when serving a response.
		const destUrl = new URL(this.path, this.url);
		applySearchParams(this.searchParams, destUrl.searchParams);

		// If the new dest is not an URL, update the path with the path from the URL.
		if (!isUrl(this.path)) this.path = destUrl.pathname;

		return prevPath;
	}

	/**
	 * Applies the route's redirects for locales and internationalization.
	 *
	 * @param route Build output config source route.
	 */
	applyLocaleRedirects(route) {
		if (!route.locale?.redirect) return;

		if (!this.locales) this.locales = {};
		Object.assign(this.locales, route.locale.redirect);

		// Automatic locale detection is only supposed to occur at the root. However, the build output
		// sometimes uses `/` as the regex instead of `^/$`. So, we should check if the `route.src` is
		// equal to the path if it is not a regular expression, to determine if we are at the root.
		// https://nextjs.org/docs/pages/building-your-application/routing/internationalization#automatic-locale-detection
		const srcIsRegex = /^\^(.)*$/.test(route.src);
		if (!srcIsRegex && route.src !== this.path) return;

		// If we already have a location header set, we might have found a locale redirect earlier.
		if (this.headers.normal.has('location')) return;

		const {
			locale: { redirect: redirects, cookie: cookieName },
		} = route;

		const cookieValue = cookieName && this.cookies[cookieName];
		const cookieLocales = parseAcceptLanguage(cookieValue ?? '');

		const headerLocales = parseAcceptLanguage(
			this.reqCtx.request.headers.get('accept-language') ?? ''
		);

		// Locales from the cookie take precedence over the header.
		const locales = [...cookieLocales, ...headerLocales];

		const redirectLocales = locales
			.map(locale => redirects[locale])
			.filter(Boolean);

		const redirectValue = redirectLocales[0];
		if (redirectValue) {
			const needsRedirecting = !this.path.startsWith(redirectValue);
			if (needsRedirecting) {
				this.headers.normal.set('location', redirectValue);
				this.status = 307;
			}
			return;
		}
	}

	/**
	 * Modifies the source route's `src` regex to be friendly with previously found locale's in the
	 * `miss` phase.
	 *
	 * Sometimes, there is a source route with `src: '/{locale}'`, which rewrites all paths containing
	 * the locale to `/`. This is problematic for matching, and should only do this if the path is
	 * exactly the locale, i.e. `^/{locale}$`.
	 *
	 * @param route Build output config source route.
	 * @param phase Current phase of the routing process.
	 * @returns The route with the locale friendly regex.
	 */
	getLocaleFriendlyRoute(
		route,
		phase
	) {
		if (
			!this.locales ||
			phase !== 'miss' ||
			!/^\//.test(route.src) ||
			!(route.src.slice(1) in this.locales)
		) {
			return route;
		}

		return {
			...route,
			src: `^${route.src}$`,
		};
	}

	/**
	 * Checks a route to see if it matches the current request.
	 *
	 * @param phase Current phase of the routing process.
	 * @param route Build output config source route.
	 * @returns The status from checking the route.
	 */
	async checkRoute(
		phase,
		rawRoute
	) {
		const route = this.getLocaleFriendlyRoute(rawRoute, phase);
		const routeMatch = this.checkRouteMatch(route, phase === 'error');

		// If this route doesn't match, continue to the next one.
		if (!routeMatch?.match) return 'skip';

		const { match: srcMatch, captureGroupKeys } = routeMatch;

		// If this route overrides, replace the response headers and status.
		this.applyRouteOverrides(route);

		// If this route has a locale, apply the redirects for it.
		this.applyLocaleRedirects(route);

		// Call and process the middleware if this is a middleware route.
		const success = await this.runRouteMiddleware(route.middlewarePath);
		if (!success) return 'error';

		// Update final headers with the ones from this route.
		this.applyRouteHeaders(route, srcMatch, captureGroupKeys);

		// Update the status code if this route has one.
		this.applyRouteStatus(route);

		// Update the path with the new destination.
		const prevPath = this.applyRouteDest(route, srcMatch, captureGroupKeys);

		// If `check` is required and the path isn't a URL, check it again.
		if (route.check && !isUrl(this.path)) {
			if (prevPath === this.path) {
				// NOTE: If the current/rewritten path is the same as the one that entered the phase, it
				// can cause an infinite loop. Therefore, we should just set the status to `404` instead
				// when we are in the `miss` phase. Otherwise, we should continue to the next phase.
				// This happens with invalid `/_next/static/...` and `/_next/data/...` requests.

				if (phase !== 'miss') {
					return await this.checkPhase(getNextPhase(phase));
				}

				this.status = 404;
			} else if (phase === 'miss') {
				// When in the `miss` phase, enter `filesystem` if the file is not in the build output. This
				// avoids rewrites in `none` that do the opposite of those in `miss`, and would cause infinite
				// loops (e.g. i18n). If it is in the build output, remove a potentially applied `404` status.
				if (!(this.path in this.output)) {
					return await this.checkPhase('filesystem');
				}

				if (this.status === 404) {
					this.status = undefined;
				}
			} else {
				// In all other instances, we need to enter the `none` phase so we can ensure that requests
				// for the `RSC` variant of pages are served correctly.
				return await this.checkPhase('none');
			}
		}

		// If we found a match and shouldn't continue finding matches, break out of the loop.
		if (!route.continue) {
			return 'done';
		}

		return 'next';
	}

	/**
	 * Checks a phase from the routing process to see if any route matches the current request.
	 *
	 * @param phase Current phase for routing.
	 * @returns The status from checking the phase.
	 */
	async checkPhase(phase) {
		if (this.checkPhaseCounter++ >= 50) {
			// eslint-disable-next-line no-console
			console.error(
				`Routing encountered an infinite loop while checking ${this.url.pathname}`
			);
			this.status = 500;
			return 'error';
		}

		let shouldContinue = true;

		for (const route of this.routes[phase]) {
			const result = await this.checkRoute(phase, route);

			if (result === 'error') {
				return 'error';
			}

			if (result === 'done') {
				shouldContinue = false;
				break;
			}
		}

		// In the `hit` phase or for external urls/redirects, return the match.
		if (
			phase === 'hit' ||
			isUrl(this.path) ||
			this.headers.normal.has('location')
		) {
			return 'done';
		}

		let pathExistsInOutput = this.path in this.output;

		// If a path with a trailing slash entered the `rewrite` phase and didn't find a match, it might
		// be due to the `trailingSlash` setting in `next.config.js`. Therefore, we should remove the
		// trailing slash and check again before entering the next phase.
		if (phase === 'rewrite' && !pathExistsInOutput && this.path.endsWith('/')) {
			const newPath = this.path.replace(/\/$/, '');
			pathExistsInOutput = newPath in this.output;
			if (pathExistsInOutput) {
				this.path = newPath;
			}
		}

		// In the `miss` phase, set status to 404 if no path was found and it isn't an error code.
		if (phase === 'miss' && !pathExistsInOutput) {
			const should404 = !this.status || this.status < 400;
			this.status = should404 ? 404 : this.status;
		}

		let nextPhase = 'miss';
		if (pathExistsInOutput || phase === 'miss' || phase === 'error') {
			// If the route exists, enter the `hit` phase. For `miss` and `error` phases, enter the `hit`
			// phase to update headers (e.g. `x-matched-path`).
			nextPhase = 'hit';
		} else if (shouldContinue) {
			nextPhase = getNextPhase(phase);
		}

		return await this.checkPhase(nextPhase);
	}

	/**
	 * Runs the matcher for a phase.
	 *
	 * @param phase The phase to start matching routes from.
	 * @returns The status from checking for matches.
	 */
	async run(
		phase = 'none'
	) {
		// Reset the counter for each run.
		this.checkPhaseCounter = 0;
		const result = await this.checkPhase(phase);

		// Check if path is an external URL.
		if (isUrl(this.path)) {
			this.headers.normal.set('location', this.path);
		}

		// Update status to redirect user to external URL.
		if (
			this.headers.normal.has('location') &&
			(!this.status || this.status < 300 || this.status >= 400)
		) {
			this.status = 307;
		}

		return result;
	}
}

// [END] Routes matcher ------------------------------------------------------------

// [START] handle request --------------------------------------------------------------------
/**
 * Handles a request by processing and matching it against all the routing phases.
 *
 * @param reqCtx Request Context object (contains all we need in to know regarding the request in order to handle it).
 * @param config The processed Vercel build output config.
 * @param output Vercel build output.
 * @returns An instance of the router.
 */
async function handleRequest(
	reqCtx,
	config,
	output
) {
	const matcher = new RoutesMatcher(config.routes, output, reqCtx);
	const match = await findMatch(matcher);

	return generateResponse(reqCtx, match, output);
}

/**
 * Finds a match for the request.
 *
 * @param matcher Instance of the matcher for the request.
 * @param phase The phase to run, either `none` or `error`.
 * @param skipErrorMatch Whether to skip the error match.
 * @returns The matched set of path, status, headers, and search params.
 */
async function findMatch(
	matcher,
	phase = 'none',
	skipErrorMatch = false
) {
	const result = await matcher.run(phase);

	if (
		result === 'error' ||
		(!skipErrorMatch && matcher.status && matcher.status >= 400)
	) {
		return findMatch(matcher, 'error', true);
	}

	return {
		path: matcher.path,
		status: matcher.status,
		headers: matcher.headers,
		searchParams: matcher.searchParams,
	};
}

/**
 * Serves a file from the Vercel build output.
 *
 * @param reqCtx Request Context object.
 * @param match The match from the Vercel build output.
 * @returns A response object.
 */
async function generateResponse(
	reqCtx,
	{ path = '/404', status, headers, searchParams },
	output
) {
	// Redirect user to external URL for redirects.
	if (headers.normal.has('location')) {
		// Apply the search params to the location header.
		const location = headers.normal.get('location') ?? '/';
		const paramsStr = [...searchParams.keys()].length
			? `?${searchParams.toString()}`
			: '';
		headers.normal.set('location', `${location}${paramsStr}`);

		return new Response(null, { status, headers: headers.normal });
	}


	let resp = await runOrFetchBuildOutputItem(output[path], reqCtx, {
		path,
		status,
		headers,
		searchParams,
	});

	const newHeaders = headers.normal;
	applyHeaders(newHeaders, resp.headers);
	applyHeaders(newHeaders, headers.important);

	resp = new Response(resp.body, {
		...resp,
		status: status || resp.status,
		headers: newHeaders,
	});

	return resp;
}

// [END] handle request --------------------------------------------------------------------

// [START] get assets ---------------------------------------------------------------
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
// [END] get assets ---------------------------------------------------------------

// [START] MAIN --------------------------------------------------------------------

async function main(request, env, ctx) {
	globalThis.process.env = { ...globalThis.process.env, ...env };

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

		event.respondWith(main(event.request, env, context));
	} catch (error) {
		console.log("Error: ")
		console.log(error)
	}
});
// [END] MAIN --------------------------------------------------------------------