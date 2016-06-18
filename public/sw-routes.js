// var helpers = require('../helpers');
// var cacheOnly = require('./cacheOnly');
function category(request, values, options) {

  return fetch(request.clone())
    .then(function(response) {
      return response.json()
        .then(function(data) {
          console.log('JSON: ', data)
          console.log('found resp: ', response)
          return response.clone();
        })
    })
  // console.log('REQUEST: ', request, values, options)
  // return new Promise(function(resolve, reject) {
  //   var rejected = false;
  //   var reasons = [];
  //
  //   var maybeReject = function(reason) {
  //     reasons.push(reason.toString());
  //     if (rejected) {
  //       reject(new Error('Both cache and network failed: "' +
  //           reasons.join('", "') + '"'));
  //     } else {
  //       rejected = true;
  //     }
  //   };
  //
  //   var maybeResolve = function(result) {
  //     if (result instanceof Response) {
  //       resolve(result);
  //     } else {
  //       maybeReject('No result returned');
  //     }
  //   };
  //
  //   // helpers.fetchAndCache(request.clone(), options)
  //   //   .then(maybeResolve, maybeReject);
  //
  //   // cacheOnly(request, values, options)
  //   //   .then(maybeResolve, maybeReject);
  // });
}


// toolbox.router.post(/\/api\/categories/, category, {
// 	debug: true,
//   cache: {
//     name: 'cat-cache',
//     maxEntries: 10,
//     maxAgeSeconds: 360,
//   }
// })
