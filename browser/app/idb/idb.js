(function () {
  // 'use strict';

  if (!window.angular) throw new Error('Angular required');
  var idb = angular.module('dexieIdb', []);

  idb.factory('idbService', function ($log) {
    console.log('idbService loading..');
    if (!window.Dexie) throw new Error('Dexie not found');
    var db = new Dexie('newsDb');
    db.version(1).stores({
      categories: "++id, description, type, *pages",
      page: "++id, content, datePublished, domain, excerpt, title, url, __v, leadImageUrl"
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
      getAll: function getAll() {
        return '123';
      }
    };
  });
})();
