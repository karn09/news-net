importScripts("/localforage/dist/localforage.js");

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

//courtesy of offline cookbook
function tryOrFallback(fakeResponse) {
	// Return a handler that...
	return function (req, res) {
		// If offline, enqueue and answer with the fake response.
		if (!navigator.onLine) {
			console.log('No network availability, enqueuing');
			return enqueue(req).then(function () {
				// As the fake response will be reused but Response objects
				// are one use only, we need to clone it each time we use it.
				// return fakeResponse.clone();
				return cacheHandler(req, fakeResponse.clone());
			});
		}

		// If online, flush the queue and answer from network.
		console.log('Network available! Flushing queue.');
		return flushQueue().then(function () {
			// return fetch(req);
			return pageHandler(req);
		});
	};
}
// By using Mozilla's localforage db wrapper, we can count on
// a fast setup for a versatile key-value database. We use
// it to store queue of deferred requests.

// Enqueue consists of adding a request to the list. Due to the
// limitations of IndexedDB, Request and Response objects can not
// be saved so we need an alternative representations. This is
// why we call to `serialize()`.`
function enqueue(request) {
	return serialize(request).then(function (serialized) {
		localforage.getItem('queue').then(function (queue) {
			/* eslint no-param-reassign: 0 */
			queue = queue || [];
			queue.push(serialized);
			return localforage.setItem('queue', queue).then(function () {
				console.log(serialized.method, serialized.url, 'enqueued!');
			});
		});
	});
}

// Flush is a little more complicated. It consists of getting
// the elements of the queue in order and sending each one,
// keeping track of not yet sent request. Before sending a request
// we need to recreate it from the alternative representation
// stored in IndexedDB.
function flushQueue() {
	// Get the queue
	return localforage.getItem('queue').then(function (queue) {
		/* eslint no-param-reassign: 0 */
		queue = queue || [];

		// If empty, nothing to do!
		if (!queue.length) {
			return Promise.resolve();
		}

		// Else, send the requests in order...
		console.log('Sending ', queue.length, ' requests...');
		return sendInOrder(queue).then(function () {
			// **Requires error handling**. Actually, this is assuming all the requests
			// in queue are a success when reaching the Network. So it should empty the
			// queue step by step, only popping from the queue if the request completes
			// with success.
			return localforage.setItem('queue', []);
		});
	});
}

// Send the requests inside the queue in order. Waiting for the current before
// sending the next one.
function sendInOrder(requests) {
	// The `reduce()` chains one promise per serialized request, not allowing to
	// progress to the next one until completing the current.
	var sending = requests.reduce(function (prevPromise, serialized) {
		console.log('Sending', serialized.method, serialized.url);
		return prevPromise.then(function () {
			return deserialize(serialized).then(function (request) {
				return fetch(request);
			});
		});
	}, Promise.resolve());
	return sending;
}

// Serialize is a little bit convolved due to headers is not a simple object.
function serialize(request) {
	var headers = {};
	// `for(... of ...)` is ES6 notation but current browsers supporting SW, support this
	// notation as well and this is the only way of retrieving all the headers.
	for (var entry of request.headers.entries()) {
		headers[entry[0]] = entry[1];
	}
	var serialized = {
		url: request.url,
		headers: headers,
		method: request.method,
		mode: request.mode,
		credentials: request.credentials,
		cache: request.cache,
		redirect: request.redirect,
		referrer: request.referrer
	};

	// Only if method is not `GET` or `HEAD` is the request allowed to have body.
	if (request.method !== 'GET' && request.method !== 'HEAD') {
		return request.clone().text().then(function (body) {
			serialized.body = body;
			return Promise.resolve(serialized);
		});
	}
	return Promise.resolve(serialized);
}

// Compared, deserialize is pretty simple.
function deserialize(data) {
	return Promise.resolve(new Request(data.url, data));
}


function cachePage(request, values, options) {
	if (request.method === 'GET') {
		var pageRef = request.url.match(/\/api\/pages\/([1-9].*|[a-z].*)/) || request;
		return openCache(options).then(function (cache) {
			if (Array.isArray(pageRef)) {
				console.log('Cache found: ', cache.match(pageRef[1]));
				return cache.match(pageRef[1]);
			} else {
				console.log('Cache found: ', cache.match(pageRef));
				return cache.match(pageRef);
			}
		});
	};
	// if (request.method === 'POST') {
	// 	return openCache(options).then(function (cache) {
	// 		console.log('POST Cache: ', cache.match(request));
	// 		return cache.match(request);
	// 	});
	// };
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
						// var cacheOptions = options.cache || globalOptions.cache;
						//
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


// fetch and cache, whichever is fastest return.
function pageHandler(request, values, options, fakeResponse) {

	return new Promise(function (resolve, reject) {
		var rejected = false;
		var reasons = [];

		var maybeReject = function (reason) {
			reasons.push(reason.toString());
			if (rejected) {
				// reject(new Error('Both cache and network failed: ' + reasons.join(', ')));
				reject(fakeResponse)
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
// return from cache only, if not found, reject with custom object
function cacheHandler(request, response) {
	return cachePage(request)
		.then(function (data) {
			console.log(data)
			return data;
		})
		.catch(function () {
			return response;
		})

}

// on post to /api/pages/ take control of request to pageHandler.
// pageHandler will resolve the new page ID and cache to matching ID within
// storage. Both "fetchAndCachePage" and "cachePage" are called.
// toolbox.router.post(/\/api\/pages(\/|)/, pageHandler, {
// 	debug: true,
// 	cache: {
// 		name: 'saved-page-cache',
// 		maxEntries: 100
// 	}
// })
//

function init(request, values, options) {

	return fetch('/api/pages/users/me')
		.then(function () {
			fetch('/api/users/me')
				.then(function () {
					fetch(request)
						.then(function(resp) {
							return resp.clone();
						})
				})
		})
}

toolbox.router.post(/\/api\/pages(\/|)/, pageHandler, {
	debug: true,
	cache: {
		name: 'saved-page-cache',
		maxEntries: 100
	}
})

toolbox.router.post('/api/comments/page/:id', tryOrFallback(new Response(null, {
	status: 202
})));

toolbox.router.put('/api/pages/:id/favorite', tryOrFallback(new Response(null, {
	status: 204
})));

toolbox.router.put('/api/pages/:id/unfavorite', tryOrFallback(new Response(null, {
	status: 204
})));

toolbox.router.delete('/api/comments/page/:id', tryOrFallback(new Response({
	status: 204
})));

toolbox.router.put('/api/comments/:id/upvote', tryOrFallback(new Response({
	status: 204
})));

toolbox.router.put('/api/comments/:id/downvote', tryOrFallback(new Response({
	status: 204
})));


toolbox.router.get('/api/users/me', tryOrFallback(new Response(JSON.stringify({
	_id: '99999999',
	pages: [{
		excerpt: 'Try again when you are online. You\'ll then be treated to amazing list of articles currently ready for further offline reading!',
		title: 'You could be online right now, but your not.',
		leadImageUrl: "/assets/images/news.jpg",
	}]
}), {
	headers: {
		'Content-Type': 'application/json'
	}
})));

toolbox.router.get(/\/api\/pages\/([1-9].*|[a-z].*)/, pageHandler, {
	debug: true,
	cache: {
		name: 'saved-page-cache',
		maxEntries: 100
	}
})

toolbox.router.get('/api/pages', tryOrFallback(new Response(JSON.stringify([{
	_id: '99999999',
	excerpt: 'Try again when you are online. You\'ll then be treated to amazing list of articles currently ready for further offline reading!',
	title: 'You could be online right now, but your not.',
	leadImageUrl: "/assets/images/news.jpg",
}]), {
	headers: {
		'Content-Type': 'application/json'
	}
})));

// toolbox.router.post('/login', init);

// toolbox.router.get('/api/pages', pageHandler, {
// 	debug: true,
// 	cache: {
// 		name: 'aggregate-page-cache',
// 		maxEntries: 5,
// 	}
// })

toolbox.precache(
	[
		'/collections',
		'/subscriptions',
		'/articles',
		'/api/pages',
		// '/app/my-collections/collections.html',
		'/api/subscriptions/user/me?long=true',
		'/api/folders/user/me?long=true',
	]
)
