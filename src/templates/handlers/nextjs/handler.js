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


// ^^^^^^^ TEMP INJECT COOKIE LIB ^^^^^^^^^


const hasField = ({
  request,
  url,
  cookies,
}, has) => {
  switch (has.type) {
    case "host": {
      return url.host === has.value;
    }
    case "header": {
      if (has.value !== undefined) {
        return request.headers.get(has.key)?.match(has.value);
      }

      return request.headers.has(has.key);
    }
    case "cookie": {
      const cookie = cookies[has.key];

      if (has.value !== undefined) {
        return cookie?.match(has.value);
      }

      return cookie !== undefined;
    }
    case "query": {
      if (has.value !== undefined) {
        return url.searchParams.get(has.key)?.match(has.value);
      }

      return url.searchParams.has(has.key);
    }
  }
};

const routesMatcher = (
  { request },
  routes
) => {
  const url = new URL(request.url);
  const cookies = parse(request.headers.get("cookie") || "");

  const matchingRoutes = [];

  for (const route of routes || []) {
    if ("methods" in route) {
      const requestMethod = request.method.toLowerCase();

      const foundMatch = route.methods.find(
        (method) => method.toLowerCase() === requestMethod
      );

      if (!foundMatch) {
        continue;
      }
    }

    if ("has" in route) {
      const okay = route.has.every((has) =>
        hasField({ request, url, cookies }, has)
      );

      if (!okay) {
        continue;
      }
    }

    if ("missing" in route) {
      const notOkay = route.missing.find((has) =>
        hasField({ request, url, cookies }, has)
      );

      if (notOkay) {
        continue;
      }
    }

    let caseSensitive = false;
    if ("caseSensitive" in route && route.caseSensitive) {
      caseSensitive = true;
    }

    if ("src" in route) {
      const regExp = new RegExp(route.src, caseSensitive ? undefined : "i");
      const match = url.pathname.match(regExp);

      if (match) {
        matchingRoutes.push(route);
      }
    } else {
      matchingRoutes.push(route);
    }
  }

  return matchingRoutes;
};

async function handleRequest(request, env, context) {
  const pathname = decodeURI(new URL(request.url).pathname);
  const routes = routesMatcher({ request }, __CONFIG__.routes);

  const assetsPaths = __ASSETS_MANIFEST__;

  const isAsset = assetsPaths.includes(pathname);

  if (isAsset) {
    return getStorageAsset(request);
  }

  for (const route of routes) {
    if ("middlewarePath" in route && route.middlewarePath in __MIDDLEWARE__) {
      return await __MIDDLEWARE__[route.middlewarePath].entrypoint.default(
        request,
        context
      );
    }
  }

  const findedRoutes = {};
  for (functionName of Object.keys(__FUNCTIONS__)) {
    const { matchers, entrypoint } = __FUNCTIONS__[functionName];

    let found = false;
    for (const matcher of matchers) {
      if (matcher.regexp) {
        if (pathname.match(new RegExp(matcher?.regexp))) {
          found = true;
          break;
        }
      }
    }

    if (found) {
        // add route with priority based on route type
        let priority = 1;
        if (functionName.includes("...")) {
          priority = 3;
        } else if(functionName.includes("[")) {
          priority = 2;
        }

        findedRoutes[functionName] = { entrypoint, priority }
    }
  }

  // exec finded route based on priority (ASC order)
  const routeNames = Object.keys(findedRoutes)
  const orderedRoutes = Object.values(findedRoutes).sort((a,b) => a.priority - b.priority)
  if (!orderedRoutes[0]) {
    const page = assetsPaths.find((f) => f.endsWith(".html") && f.includes(pathname) && pathname !== "/");
    if (pathname === "/" || page) {
      return getStorageAsset(request, page);
    }
    return getStorageAsset(request, "/404.html");
  }

  return orderedRoutes[0].entrypoint.default(request, context);
}

const getStorageAsset = async (request, pages) => {
  const VERSION_ID = __VERSION_ID__;
  try {
    const requestPath = pages || new URL(request.url).pathname;
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

    event.respondWith(handleRequest(event.request, env, context));
  } catch (error) {
    console.log("Error: ")
    console.log(error)
  }
});