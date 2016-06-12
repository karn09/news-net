'use strict';

// // var db = new Dexie('newsDb');
// //
// // db.version(1).stores({
// //   categories: "++id, description, type, *pages",
// //   comments: "++id"
// // })
//
(function () {
  // 'use strict';

  if (!window.angular) throw new Error('Angular required');
  var idb = angular.module('dexieIdb', []);
  idb.factory('idbService', function ($log) {
    console.log('idbService loading..');
    if (!window.Dexie) throw new Error('Dexie not found');
    if (window.Dexie) throw 'Found!';
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQU9BLENBQUEsWUFBQTs7O0FBR0EsTUFBQSxDQUFBLE9BQUEsT0FBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsa0JBQUEsQ0FBQTtBQUNBLE1BQUEsTUFBQSxRQUFBLE1BQUEsQ0FBQSxVQUFBLEVBQUEsRUFBQSxDQUFBO0FBQ0EsTUFBQSxPQUFBLENBQUEsWUFBQSxFQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsWUFBQSxHQUFBLENBQUEsc0JBQUE7QUFDQSxRQUFBLENBQUEsT0FBQSxLQUFBLEVBQUEsTUFBQSxJQUFBLEtBQUEsQ0FBQSxpQkFBQSxDQUFBO0FBQ0EsUUFBQSxPQUFBLEtBQUEsRUFBQSxNQUFBLFFBQUE7QUFDQSxRQUFBLEtBQUEsSUFBQSxLQUFBLENBQUEsUUFBQSxDQUFBO0FBQ0EsT0FBQSxPQUFBLENBQUEsQ0FBQSxFQUFBLE1BQUEsQ0FBQTtBQUNBLGtCQUFBLGlDQURBO0FBRUEsWUFBQTtBQUZBLEtBQUE7O0FBS0EsT0FBQSxJQUFBLEdBQ0EsSUFEQSxDQUNBLFlBQUE7QUFDQSxTQUFBLEtBQUE7QUFDQSxTQUFBLElBQUEsR0FBQSxJQUFBLENBQUEsWUFBQTtBQUNBLGFBQUEsS0FBQSxDQUFBLGlDQUFBO0FBQ0EsT0FGQTtBQUdBLEtBTkE7O0FBUUEsT0FBQSxFQUFBLENBQUEsU0FBQSxFQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsV0FBQSxJQUFBLENBQUEsVUFBQSxFQUFBLEdBQUE7QUFDQSxLQUZBOztBQUlBLFdBQUE7QUFDQSxjQUFBLGtCQUFBO0FBQ0EsZUFBQSxLQUFBO0FBQ0E7QUFIQSxLQUFBO0FBTUEsR0E1QkE7QUE4QkEsQ0FuQ0EiLCJmaWxlIjoiZGIuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyAvLyB2YXIgZGIgPSBuZXcgRGV4aWUoJ25ld3NEYicpO1xyXG4vLyAvL1xyXG4vLyAvLyBkYi52ZXJzaW9uKDEpLnN0b3Jlcyh7XHJcbi8vIC8vICAgY2F0ZWdvcmllczogXCIrK2lkLCBkZXNjcmlwdGlvbiwgdHlwZSwgKnBhZ2VzXCIsXHJcbi8vIC8vICAgY29tbWVudHM6IFwiKytpZFwiXHJcbi8vIC8vIH0pXHJcbi8vXHJcbihmdW5jdGlvbigpIHtcclxuICAvLyAndXNlIHN0cmljdCc7XHJcblxyXG4gIGlmICghd2luZG93LmFuZ3VsYXIpIHRocm93IG5ldyBFcnJvcignQW5ndWxhciByZXF1aXJlZCcpO1xyXG4gIHZhciBpZGIgPSBhbmd1bGFyLm1vZHVsZSgnZGV4aWVJZGInLCBbXSk7XHJcbiAgaWRiLmZhY3RvcnkoJ2lkYlNlcnZpY2UnLCBmdW5jdGlvbiAoJGxvZykge1xyXG4gICAgY29uc29sZS5sb2coJ2lkYlNlcnZpY2UgbG9hZGluZy4uJylcclxuICAgIGlmICghd2luZG93LkRleGllKSB0aHJvdyBuZXcgRXJyb3IoJ0RleGllIG5vdCBmb3VuZCcpO1xyXG4gICAgaWYgKHdpbmRvdy5EZXhpZSkgdGhyb3cgJ0ZvdW5kISdcclxuICAgIHZhciBkYiA9IG5ldyBEZXhpZSgnbmV3c0RiJyk7XHJcbiAgICBkYi52ZXJzaW9uKDEpLnN0b3Jlcyh7XHJcbiAgICAgIGNhdGVnb3JpZXM6IFwiKytpZCwgZGVzY3JpcHRpb24sIHR5cGUsICpwYWdlc1wiLFxyXG4gICAgICBwYWdlOiBcIisraWQsIGNvbnRlbnQsIGRhdGVQdWJsaXNoZWQsIGRvbWFpbiwgZXhjZXJwdCwgdGl0bGUsIHVybCwgX192LCBsZWFkSW1hZ2VVcmxcIlxyXG4gICAgfSk7XHJcblxyXG4gICAgZGIub3BlbigpXHJcbiAgICAgIC50aGVuKGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGRiLmNsb3NlKCk7XHJcbiAgICAgICAgZGIub3BlbigpLnRoZW4oZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICAkbG9nLmRlYnVnKCdPcGVuaW5nIGNvbm5lY3Rpb24gdG8gaW5kZXhlZERiJyk7XHJcbiAgICAgICAgfSlcclxuICAgICAgfSk7XHJcblxyXG4gICAgZGIub24oJ2Jsb2NrZWQnLCBmdW5jdGlvbihlcnIpIHtcclxuICAgICAgJGxvZy53YXJuKCdibG9ja2VkICcsIGVycilcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgIGdldEFsbDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuICcxMjMnXHJcbiAgICAgIH1cclxuICAgIH07XHJcblxyXG4gIH0pO1xyXG5cclxufSkoKTtcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
