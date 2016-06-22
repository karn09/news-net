var scope;
if (self.registration) {
	scope = self.registration.scope;
} else {
	scope = self.scope || new URL('./', self.location).href;
}

globalOptions = {
	cache: {
		name: '$$$toolbox-cache$$$' + scope + '$$$',
		maxAgeSeconds: null,
		maxEntries: null
	},
	debug: false,
	networkTimeoutSeconds: null,
	preCacheItems: [],
	// A regular expression to apply to HTTP response codes. Codes that match
	// will be considered successes, while others will not, and will not be
	// cached.
	successResponses: /^0|([123]\d\d)|(40[14567])|410$/
};

function cachePage(request, values, options) {
	if (request.method === 'GET') {
    var pageRef = request.url.match(/\/api\/pages\/([1-9].*|[a-z].*)/) || request;
    return openCache(options).then(function (cache) {
      if (Array.isArray(pageRef)) {
        return cache.match(pageRef[1]);
      } else {
        return cache.match(pageRef);
      }
    });
  };
  if (request.method === 'POST') {
    return openCache(options).then(function (cache) {
      console.log('POST Cache: ', cache.match(request));
      return cache.match(request);
    });
  };
}

function openCache(options) {
	var cacheName;
	if (options && options.cache) {
		cacheName = options.cache.name;
	}
	cacheName = cacheName || globalOptions.cache.name;

	return caches.open(cacheName);
}

function fetchAndCachePage(request, options) {
	options = options || {};
	var successResponses = options.successResponses ||
		globalOptions.successResponses;

	return fetch(request.clone()).then(function (response) {
    var pageRef;
		// check for POST method on request
		if (request.method === 'POST' && successResponses.test(response.status)) {
			// if POST found, clone response and resolve response to JSON
			response.clone().json().then(function (page) {
				// open cache using name supplied in POST route.
				openCache(options).then(function (cache) {
					console.log("POST PAGE: ", page)
						// add to cache using page ID with JSON obj as data.
          pageRef = page._id || request;
          cache.put(pageRef, response)
						.then(function () {
							console.log('Page Successfully added at ', page._id);
							var cacheOptions = options.cache || globalOptions.cache;
						});
				});
			})
		};

    //
		if (request.method === 'GET' && successResponses.test(response.status)) {
			console.log('GET: ', request, response)

			response.clone().json().then(function (page) {
				openCache(options).then(function (cache) {
          pageRef = page._id || request;
					cache.put(pageRef, response).then(function () {
						// If any of the options are provided in options.cache then use them.
						// Do not fallback to the global options for any that are missing
						// unless they are all missing.
						// debugger;
						var cacheOptions = options.cache || globalOptions.cache;

						// Only run the cache expiration logic if at least one of the maximums
						// is set, and if we have a name for the cache that the options are
						// being applied to.
						// if ((cacheOptions.maxEntries || cacheOptions.maxAgeSeconds) &&
						//     cacheOptions.name) {
						//   queueCacheExpiration(request, cache, cacheOptions);
						// }
					});
				});
			});
		}

		return response.clone();
	});
}


// var helpers = require('../helpers');
// var cacheOnly = require('./cacheOnly');
function pageHandler(request, values, options) {

	return new Promise(function (resolve, reject) {
		var rejected = false;
		var reasons = [];

		var maybeReject = function (reason) {
			reasons.push(reason.toString());
			if (rejected) {
				reject(new Error('Both cache and network failed: ' + reasons.join(', ')));
			} else {
				rejected = true;
			}
		};
		var maybeResolve = function (result) {
			if (result instanceof Response) {
				resolve(result);
			} else {
				maybeReject('No result returned.');
			}
		};

		fetchAndCachePage(request.clone(), options)
			.then(maybeResolve, maybeReject);

		cachePage(request, values, options)
			.then(maybeResolve, maybeReject)

	})
}

// on post to /api/pages/ take control of request to pageHandler.
// pageHandler will resolve the new page ID and cache to matching ID within
// storage. Both "fetchAndCachePage" and "cachePage" are called.
toolbox.router.post(/\/api\/pages(\/|)/, pageHandler, {
	debug: true,
	cache: {
		name: 'saved-page-cache',
		maxEntries: 100
	}
})

toolbox.router.get(/\/api\/pages\/([1-9].*|[a-z].*)/, pageHandler, {
	debug: true,
	cache: {
		name: 'saved-page-cache',
		maxEntries: 100
  }
})
toolbox.router.get(/\/api\/pages(\/|)/, pageHandler, {
  debug: true,
  cache: {
    name: 'aggregate-page-cache',
    maxEntries: 5,
    maxAgeSeconds: 5000
  }
})
// toolbox.router.get(/\/api\/categories/, )
