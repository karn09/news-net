(function () {
		// 'use strict';

		if (!window.angular) throw new Error('Angular required');
		var idb = angular.module('dexieIdb', []);

		idb.factory('idbService', function ($log, $q) {
			console.log('idbService loading..');
			if (!window.Dexie) throw new Error('Dexie not found');
			var db = new Dexie('newsDb');

      db.version(1).stores({
				categories: "&_id, description, type, *pages",
				page: "++_id, _id, content, datePublished, domain, excerpt, title, url, __v, leadImageUrl"
			});

			db.open().then(function () {
				db.close();
				db.open().then(function () {
					$log.debug('Opening connection to indexedDb');
				});
			});

			db.on('blocked', function (err) {
				$log.warn('blocked ', err);
			});

			return {
				getAll: function () {
					return '123';
				},
				add: function (store, value, id) {
					var deferred = $q.defer();
					if (store === 'categories') {
						db.categories.bulkAdd(value)
							.then(function (data) {
								deferred.resolve(data);
							})
              .catch(function(err) {
                deferred.resolve(err);
              })
					} else if (store === 'page') {
						db.page.add(value)
							.then(function (data) {
								deferred.resolve(data);
							})
					}
					return deferred.promise;
				}
			};
		});

})();
