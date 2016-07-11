'use strict';

function cacheDelete() {
	console.log('Deleting cache...');
	caches.keys().then(function (keys) {
		keys.forEach(function (key) {
			caches.delete(key);
		});
	});
}

window.app = angular.module('FullstackGeneratedApp', ['fsaPreBuilt', 'ui.router', 'ui.bootstrap', 'ngAnimate', 'ngMaterial', 'ngMessages']);

app.config(function ($urlRouterProvider, $locationProvider, $mdThemingProvider) {
	// This turns off hashbang urls (/#about) and changes it to something normal (/about)
	$locationProvider.html5Mode(true);
	// If we go to a URL that ui-router doesn't have registered, go to the "/" url.
	$urlRouterProvider.otherwise('/');
	// Trigger page refresh when accessing an OAuth route
	$urlRouterProvider.when('/auth/:provider', function () {
		window.location.reload();
	});

	$mdThemingProvider.theme('default').primaryPalette('blue-grey').accentPalette('blue-grey');
});

// This app.run is for controlling access to specific states.
app.run(function ($rootScope, AuthService, $state) {

	// The given state requires an authenticated user.
	var destinationStateRequiresAuth = function destinationStateRequiresAuth(state) {
		return state.data && state.data.authenticate;
	};

	// $stateChangeStart is an event fired
	// whenever the process of changing a state begins.

	AuthService.getLoggedInUser().then(function (loggedInUser) {
		$rootScope.loggedInUser = loggedInUser;
	});

	$rootScope.$on('$stateChangeStart', function (event, toState, toParams) {

		if (!destinationStateRequiresAuth(toState)) {
			// The destination state does not require authentication
			// Short circuit with return.
			return;
		}

		if (AuthService.isAuthenticated()) {
			// The user is authenticated.
			// Short circuit with return.
			return;
		}

		// Cancel navigating to new state.
		event.preventDefault();

		AuthService.getLoggedInUser().then(function (user) {
			// If a user is retrieved, then renavigate to the destination
			// (the second time, AuthService.isAuthenticated() will work)
			// otherwise, if no user is logged in, go to "login" state.         
			if (user) {
				$state.go(toState.name, toParams);
			} else {
				$state.go('login');
			}
		});
	});
});

app.config(function ($stateProvider) {
	$stateProvider.state('articles', {
		url: '/articles',
		templateUrl: 'app/articles/articles.html',
		resolve: {
			articles: function articles(ArticlesFactory) {
				return ArticlesFactory.fetchAll();
			}
		},
		controller: 'ArticlesCtrl'
	});
});

app.config(function ($stateProvider) {
	$stateProvider.state('article', {
		url: '/articles/:id',
		templateUrl: 'app/article-view/article-view.html',
		resolve: {
			article: function article($stateParams, ArticlesFactory) {
				return ArticlesFactory.fetchArticleById($stateParams.id);
			}
		},
		controller: 'ArticleCtrl'
	});
});

app.controller('ArticlesCtrl', function ($scope, articles, ArticlesFactory) {
	$scope.articles = articles.pages || articles;

	ArticlesFactory.fetchUserArticlesArray().then(function (savedArticles) {
		savedArticles.forEach(function (id) {

			var index = $scope.articles.map(function (article) {
				return article._id + "";
			}).indexOf(id + "");

			if (index >= 0) {
				$scope.articles[index].liked = true;
			}
		});
	});
});

app.controller('ArticleCtrl', function ($scope, article, $compile) {
	$scope.current = article;
	$scope.title = article.title;
	$scope.content = article.content;
});

//To-Do - User comments, individual comment
app.config(function ($stateProvider) {
	$stateProvider.state('pageComments', {
		url: '/comments/page/:id',
		templateUrl: 'app/comments/comments.html',
		resolve: {
			comments: function comments($stateParams, CommentsFactory) {
				return CommentsFactory.fetchAllForPage($stateParams.id);
			}
		},
		controller: 'CommentsCtrl'
	});
});

app.config(function ($stateProvider) {
	$stateProvider.state('userComments', {
		url: '/comments/user/:id',
		templateUrl: 'app/comments/comments.html',
		resolve: {
			comments: function comments($stateParams, CommentsFactory) {
				return CommentsFactory.fetchAllForUser($stateParams.id);
			}
		},
		controller: 'CommentsCtrl'
	});
});

//Need to fix Angular bug here
app.controller('editCommentCtrl', function ($mdDialog, $state, $scope, CommentsFactory) {
	this.close = function () {
		$mdDialog.cancel();
	};

	this.submit = function (index, data) {
		var comment = $scope.comments.comments[index];
		CommentsFactory.editComment(comment._id, data).then(function (response) {
			$mdDialog.hide();
			$scope.comments.comments[index].text = response.text;
		});
	};
});

app.controller('CommentsCtrl', function ($scope, $rootScope, $stateParams, $mdDialog, comments, CommentsFactory, AuthService) {
	$scope.comments = comments;
	console.log("scope comments", $scope.comments);

	AuthService.getLoggedInUser().then(function (user) {
		$scope.user = user;
		console.log("user", $scope.user);
	});

	$scope.submitComment = function () {
		CommentsFactory.postCommentToArticle($stateParams.id, $scope.input).then(function (comment) {
			$scope.comments.comments.push(comment);
		});
	};

	$scope.removeComment = function (index, id) {
		CommentsFactory.removeComment(id);
		$scope.comments.comments.splice(index, 1);
	};

	$scope.editComment = function () {
		$mdDialog.show({
			scope: this,
			preserveScope: true,
			clickOutsideToClose: true,
			controller: 'editCommentCtrl',
			controllerAs: 'edit',
			templateUrl: '/app/comments/edit-comment.html'
		});
	};

	$scope.vote = function (id, direction) {
		CommentsFactory.vote(id, direction).then(function (response) {
			var index = $scope.comments.comments.map(function (element) {
				return element._id;
			}).indexOf(response._id);
			$scope.comments.comments[index].voteCount = response.voteCount;
			$scope.comments.comments.sort(function (a, b) {
				return b.voteCount - a.voteCount;
			});
		});
	};
});

app.config(function ($stateProvider) {
	$stateProvider.state('folders', {
		url: '/folders',
		templateUrl: 'app/folders/folders.html',
		resolve: {
			categories: function categories(CategoriesFactory) {
				return CategoriesFactory.getUserFoldersDetailed();
			}
		},
		controller: 'FoldersCtrl'
	}).state('folders.section', {
		parent: 'folders',
		url: '/:name',
		templateUrl: 'app/folders/folders.html',
		controller: 'FolderSectionCtrl'
	});
});

app.controller('FoldersCtrl', function ($scope, categories, CategoriesFactory) {

	$scope.categories = categories;

	$scope.removeFromFolder = function (categoryId, pageId) {
		var cId = categoryId.categoryId;var pId = pageId.pageId;
		console.log("Folders Control - Remove From\n" + "categoryId", cId, "pageId", pId);
		CategoriesFactory.removeFromFolder(cId, pId);
	};
});

app.controller('FolderSectionCtrl', function ($scope, $stateParams, categories) {
	var folderIndex = categories.map(function (element) {
		return element.description.toLowerCase();
	}).indexOf($stateParams.name.toLowerCase());

	$scope.categories = [categories[folderIndex]];
});
(function () {

	'use strict';

	// Hope you didn't forget Angular! Duh-doy.

	if (!window.angular) throw new Error('I can\'t find Angular!');

	var app = angular.module('fsaPreBuilt', []);

	app.factory('Socket', function () {
		if (!window.io) throw new Error('socket.io not found!');
		console.log('Socket connecting at: ', window.location.origin);
		return window.io(window.location.origin);
	});

	// AUTH_EVENTS is used throughout our app to
	// broadcast and listen from and to the $rootScope
	// for important events about authentication flow.
	app.constant('AUTH_EVENTS', {
		loginSuccess: 'auth-login-success',
		loginFailed: 'auth-login-failed',
		logoutSuccess: 'auth-logout-success',
		sessionTimeout: 'auth-session-timeout',
		notAuthenticated: 'auth-not-authenticated',
		notAuthorized: 'auth-not-authorized'
	});

	app.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
		var statusDict = {
			401: AUTH_EVENTS.notAuthenticated,
			403: AUTH_EVENTS.notAuthorized,
			419: AUTH_EVENTS.sessionTimeout,
			440: AUTH_EVENTS.sessionTimeout
		};
		return {
			responseError: function responseError(response) {
				$rootScope.$broadcast(statusDict[response.status], response);
				return $q.reject(response);
			}
		};
	});

	app.config(function ($httpProvider) {
		$httpProvider.interceptors.push(['$injector', function ($injector) {
			return $injector.get('AuthInterceptor');
		}]);
	});

	app.service('AuthService', function ($http, Session, $rootScope, AUTH_EVENTS, $q) {

		function onSuccessfulLogin(response) {
			var data = response.data;
			Session.create(data.id, data.user);
			$rootScope.$broadcast(AUTH_EVENTS.loginSuccess);
			return data.user;
		}

		// Uses the session factory to see if an
		// authenticated user is currently registered.
		this.isAuthenticated = function () {
			return !!Session.user;
		};

		this.getLoggedInUser = function (fromServer) {

			// If an authenticated session exists, we
			// return the user attached to that session
			// with a promise. This ensures that we can
			// always interface with this method asynchronously.

			// Optionally, if true is given as the fromServer parameter,
			// then this cached value will not be used.

			if (this.isAuthenticated() && fromServer !== true) {
				return $q.when(Session.user);
			}

			// Make request GET /session.
			// If it returns a user, call onSuccessfulLogin with the response.
			// If it returns a 401 response, we catch it and instead resolve to null.
			return $http.get('/session').then(onSuccessfulLogin).catch(function () {
				return null;
			});
		};

		this.login = function (credentials) {
			return $http.post('/login', credentials).then(onSuccessfulLogin).catch(function () {
				return $q.reject({ message: 'Invalid login credentials.' });
			});
		};

		this.logout = function () {
			return $http.get('/logout').then(function () {
				Session.destroy();
				$rootScope.$broadcast(AUTH_EVENTS.logoutSuccess);
			});
		};
	});

	app.service('Session', function ($rootScope, AUTH_EVENTS) {

		var self = this;

		$rootScope.$on(AUTH_EVENTS.notAuthenticated, function () {
			self.destroy();
		});

		$rootScope.$on(AUTH_EVENTS.sessionTimeout, function () {
			self.destroy();
		});

		this.id = null;
		this.user = null;

		this.create = function (sessionId, user) {
			this.id = sessionId;
			this.user = user;
		};

		this.destroy = function () {
			this.id = null;
			this.user = null;
		};
	});
})();

app.config(function ($stateProvider, $urlRouterProvider) {
	$stateProvider.state('home', {
		url: '/home',
		templateUrl: 'app/home/home.html',
		resolve: {
			user: function user(AuthService) {
				return AuthService.getLoggedInUser();
			},
			// recommendedArticles: function (ArticlesFactory) {
			// 	return ArticlesFactory.fetchRecommendedArticles();
			// },
			articles: function articles(ArticlesFactory) {
				return ArticlesFactory.fetchAll();
			}
		},
		controller: 'HomepageCtrl'
	});
	$urlRouterProvider.when('/', '/home');
});

app.controller('HomepageCtrl', function ($scope, $rootScope, user, articles, $state) {
	$scope.user = user;
	$scope.articles = articles;

	$scope.listArticles = function (id) {
		$state.go('article', {
			id: id
		});
	};

	$scope.tiles = buildGridModel({
		id: "",
		title: "",
		image: ""
	});

	function buildGridModel(tileTmpl) {
		var it,
		    results = [];
		for (var j = 0; j < 11; j++) {
			var article = articles[Math.floor(articles.length * Math.random())];
			it = angular.extend({}, tileTmpl);
			it._id = article._id;
			it.title = article.title;
			it.span = {
				row: 1,
				col: 1
			};
			it.image = article.leadImageUrl;
			switch (j + 1) {
				case 1:
					it.span.row = it.span.col = 2;
					break;
				case 4:
					it.span.col = 2;
					break;
				case 5:
					it.span.row = it.span.col = 2;
					break;
			}
			results.push(it);
		}
		return results;
	}
});

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
			getAll: function getAll() {
				return '123';
			},
			addPage: function addPage(value, id) {
				var deferred = $q.defer();
				db.page.add(value).then(function (data) {
					deferred.resolve(data);
				});
				return deferred.promise;
			}
		};
	});
})();

app.config(function ($stateProvider) {

	$stateProvider.state('login', {
		url: '/login',
		templateUrl: 'app/login/login.html',
		controller: 'LoginCtrl'
	});
});

app.controller('LoginCtrl', function ($scope, $rootScope, AuthService, $state) {

	$scope.login = {};
	$scope.error = null;

	$scope.sendLogin = function (loginInfo) {

		$scope.error = null;

		AuthService.login(loginInfo).then(function (loggedInUser) {
			$state.go('home');
			$rootScope.loggedInUser = loggedInUser;
			console.log($rootScope.loggedInUser);
		}).catch(function () {
			$scope.error = 'Invalid login credentials.';
		});
	};
});
app.config(function ($stateProvider) {

	$stateProvider.state('membersOnly', {
		url: '/members-area',
		template: '<img ng-repeat="item in stash" width="300" ng-src="{{ item }}" />',
		controller: function controller($scope, SecretStash) {
			SecretStash.getStash().then(function (stash) {
				$scope.stash = stash;
			});
		},
		// The following data.authenticate is read by an event listener
		// that controls access to this state. Refer to app.js.
		data: {
			authenticate: true
		}
	});
});

app.factory('SecretStash', function ($http) {

	var getStash = function getStash() {
		return $http.get('/api/members/secret-stash').then(function (response) {
			return response.data;
		});
	};

	return {
		getStash: getStash
	};
});
app.config(function ($stateProvider) {
	$stateProvider.state('collections', {
		url: '/collections',
		templateUrl: 'app/my-collections/collections.html',
		resolve: {
			articles: function articles(ArticlesFactory) {
				return ArticlesFactory.fetchUserArticlesPopulated();
			}
		},
		controller: 'ArticlesCtrl'
	});
});

//
// app.controller('ArticleCtrl', function($scope, article, $compile) {
//     $scope.current = article;
//     $scope.title = article.title;
//     $scope.content = article.content;
// });

app.config(function ($stateProvider) {
	$stateProvider.state('offline', {
		url: '/offline',
		templateUrl: 'app/offline/offline.html'
	});
});

app.config(function ($stateProvider) {

	$stateProvider.state('parser', {
		url: '/parser',
		templateUrl: 'app/parser/parser.html',
		controller: 'ParserCtrl'
	});
});

app.controller('ParserCtrl', function ($scope, $state, ArticlesFactory, Session) {

	$scope.parseUrl = function () {

		//console.log("inside parserCtrl parseUrl: session user: ", Session.user._id);

		ArticlesFactory.parseUrl($scope.url, Session.user._id).then(function (response) {
			console.log(response);
			$scope.parsed = response;
		});
	};
});

app.config(function ($stateProvider) {
	$stateProvider.state('subscriptions', {
		url: '/subscriptions',
		templateUrl: 'app/subscriptions/subscriptions.html',
		resolve: {
			categories: function categories(CategoriesFactory) {
				return CategoriesFactory.getUserSubscriptionsDetailed();
			}
		},
		controller: 'SubscriptionsCtrl'
	}).state('subscriptions.section', {
		parent: 'subscriptions',
		url: '/:name',
		templateUrl: 'app/subscriptions/subscriptions.html',
		controller: 'SubscriptionSectionCtrl'
	});
});

app.controller('SubscriptionsCtrl', function ($scope, categories, CategoriesFactory) {

	$scope.categories = categories;

	$scope.removeFromSubscription = function (categoryId, pageId) {
		var cId = categoryId.categoryId;var pId = pageId.pageId;
		console.log("Subscriptions Control - Remove From\n" + "categoryId", cId, "pageId", pId);
		CategoriesFactory.removeFromSubscription(cId, pId);
	};
});

app.controller('SubscriptionSectionCtrl', function ($scope, $stateParams, categories) {
	var subscriptionIndex = categories.map(function (element) {
		return element.description.toLowerCase();
	}).indexOf($stateParams.name.toLowerCase());

	$scope.categories = [categories[subscriptionIndex]];
});
app.factory('ArticlesFactory', function ($http, $state) {
	var ArticlesFactory = {};
	var allArticlesCache = [];
	var userArticlesCache = [];
	var userArticlesArray = [];
	var recommendedArticlesCache = [];

	ArticlesFactory.fetchAll = function () {
		return $http.get("/api/pages").then(function (response) {
			if (allArticlesCache !== response.data) {
				angular.copy(response.data, allArticlesCache);
			}
			return allArticlesCache;
		});
	};

	ArticlesFactory.fetchRecommendedArticles = function () {
		return $http.get("/api/pages/recommended").then(function (response) {
			if (recommendedArticlesCache !== response.data) {
				angular.copy(response.data, recommendedArticlesCache);
			}
			return recommendedArticlesCache;
		}).catch(function (err) {
			$state.go('articles');
		});
	};

	//Can either provide name or id as parameter (i.e. obj = {name: "Technology"})
	ArticlesFactory.fetchAllByCategory = function (obj) {
		var urlString = "/api/pages/category?";
		for (var key in obj) {
			var queryParameter = key + "=" + obj[key];
			urlString += queryParameter;
		}

		return $http.get(urlString).then(function (response) {
			return response.data;
		});
	};

	ArticlesFactory.fetchCategories = function () {
		return $http.get("/api/categories/").then(function (response) {
			console.log('factory data, ', response.data);
			return response.data;
		}).catch(function (err) {
			console.log("No connection: ", err);
		});
	};

	ArticlesFactory.fetchArticleById = function (id) {
		return $http.get("/api/pages/" + id).then(function (response) {
			return response.data;
		}).catch(function (err) {
			console.log('No response from server.. serving from object cache: ', err);
			var foundArticle = _.find(allArticlesCache, function (article) {
				return article._id === id;
			});
			console.log(foundArticle);
			return foundArticle;
		});
	};

	ArticlesFactory.addArticleToCategory = function (url, category) {
		// add one article to category
	};

	ArticlesFactory.saveArticleByUrl = function (url, category) {}
	// default to all, or optional category


	//Methods for current (logged in user)
	;ArticlesFactory.fetchUserArticlesArray = function () {
		return $http.get('api/pages/user/me').then(function (response) {
			if (response.data !== userArticlesArray) {
				angular.copy(response.data, userArticlesArray);
			}
			return userArticlesArray;
		});
	};

	ArticlesFactory.fetchUserArticlesPopulated = function () {
		return $http.get('api/users/me').then(function (response) {
			angular.copy(response.data.pages, userArticlesCache);
			return userArticlesCache;
		}).catch(function (err) {
			console.log('No internet connection, returning stale data..');
			return userArticlesCache;
		});
	};

	// TODO: sync when back online...
	ArticlesFactory.favoriteArticle = function (article) {
		var ref;
		if (typeof article === 'string') {
			ref = _.find(allArticlesCache, function (art) {
				return art._id === article;
			});
		} else {
			ref = article;
		}
		return $http.put('api/pages/' + ref._id + '/favorite').then(function (response) {
			console.log('Adding to cache...');
			userArticlesCache.push(ref);
			return response.data;
		});
	};
	// TODO: sync when back online...
	ArticlesFactory.unfavoriteArticle = function (id) {
		return $http.put('api/pages/' + id + '/unfavorite').then(function (response) {
			_.remove(userArticlesCache, function (article) {
				return id === article._id;
			});
			console.log('unfav: ', userArticlesCache);
			return response.data;
		});
	};

	//Remove article from user's list, not delete.
	// ArticlesFactory.removeArticleByID = function (id) {
	// 	return $http.put('/users/removePage/' + id)
	// 		.then(function (response) {
	// 			return response.data;
	// 		})
	// };

	ArticlesFactory.parseUrl = function (url, userid, categories) {
		//1. parse the Url
		//2. post to pages
		//3. add page to user's list
		//4. add page to categories

		var encoded = encodeURIComponent(url);
		return $http.get("/api/parser/" + encoded).then(function (result) {
			//console.log("userid: ", userid);
			return $http.post("/api/pages", result.data).then(function (pageResponse) {
				//console.log("page parsed: ", pageResponse.data);
				return $http.put("/api/users/addPage/" + userid, {
					page: pageResponse.data._id
				}).then(function (res) {
					if (categories) {
						var toUpdate = [];
						for (var i = 0; i < categories.length; i++) {
							//console.log("adding page to category: ", categories[i]);
							toUpdate.push($http.put("/api/categories/addPage/" + categories[i], {
								page: pageResponse.data._id
							}));
						}
						console.log("toUpdate: ", toUpdate);
						return Promise.all(toUpdate).then(function (response) {
							console.log("all categories updated");
							if (!checkPageCacheContains(pageResponse.data._id)) {
								console.log('Not found, add to cache');
								pageResponse.data.liked = true;
								userArticlesCache.push(pageResponse.data);
							}
							return pageResponse.data;
						});
					} else {
						// userArticlesCache.push()
						console.log('New page added: ', pageResponse.data);
						if (!checkPageCacheContains(pageResponse.data._id)) {
							console.log('Not found, add to cache');
							pageResponse.data.liked = true;
							userArticlesCache.push(pageResponse.data);
						}
						return pageResponse.data;
					}
				});
			});
		});
	};

	function checkPageCacheContains(id) {
		return _.contains(userArticlesCache, function (article) {
			return article._id === id;
		});
	};

	return ArticlesFactory;
});

app.factory('CategoriesFactory', function ($http) {
	var CategoriesFactory = {};
	var currentSubscriptions = [];
	var currentSubscriptionsDetailed = [];
	var currentFoldersDetailed = [];
	var currentFolders = [];

	CategoriesFactory.getUserSubscriptions = function () {
		return $http.get('/api/subscriptions/user/me').then(function (response) {
			if (response.data !== currentSubscriptions) {
				console.log('User subscriptions retrieved: ', response.data);
				angular.copy(response.data, currentSubscriptions);
			}
			return currentSubscriptions;
		});
	};

	CategoriesFactory.getUserSubscriptionsDetailed = function () {
		return $http.get('/api/subscriptions/user/me?long=true').then(function (response) {
			if (response.data !== currentSubscriptionsDetailed) {
				console.log('Detailed subscriptions retrieved: ', response.data);
				angular.copy(response.data, currentSubscriptionsDetailed);
			}
			return currentSubscriptionsDetailed;
		});
	};

	//Second parameter optional
	CategoriesFactory.createNewSubscription = function (name, pageId) {
		var data = { description: name };
		if (pageId) data.page = pageId;

		return $http.post('/api/subscriptions/', data).then(function (response) {
			if (currentSubscriptions.indexOf(response.data) === -1) {
				console.log('New subscription added: ', response.data);
				currentSubscriptions.push(response.data);
			}
			return response.data;
		});
	};
	// this currently only adds the article ID to an array of pages associated with a subscription.
	// does not update the detailed categories.
	CategoriesFactory.addToSubscription = function (categoryId, articleId) {
		var data = { page: articleId };
		return $http.put('/api/subscriptions/' + categoryId, data).then(function (response) {
			var idx = _.chain(currentSubscriptions).pluck('_id').indexOf(categoryId).value();
			if (idx !== -1) {
				if (currentSubscriptions[idx].pages.indexOf(articleId) === -1) {
					console.log('Page added to subscription: ', response.data);
					currentSubscriptions[idx].pages.push(articleId);
				}
			}
			return response.data;
		});
	};

	CategoriesFactory.removeFromSubscription = function (categoryId, articleId) {
		return $http.delete('/api/subscriptions/' + categoryId + '/pages/' + articleId).then(function (response) {

			//Get index of category
			var csIndex = _.chain(currentSubscriptions).pluck('_id').indexOf(categoryId).value();
			var csdIndex = _.chain(currentSubscriptionsDetailed).pluck('_id').indexOf(categoryId).value();

			//Get index of page in category's 'pages' array
			var csPageIndex = currentSubscriptions[csIndex].pages.indexOf(articleId);
			var csdPageIndex = _.chain(currentSubscriptionsDetailed[csdIndex].pages).pluck('_id').indexOf(articleId).value();

			//Remove page from index
			currentSubscriptions[csIndex].pages.splice(csPageIndex, 1);
			currentSubscriptionsDetailed[csdIndex].pages.splice(csdPageIndex, 1);

			return response.data;
		});
	};

	//If user is admin, this deletes the subscription
	CategoriesFactory.removeSubscription = function (id) {
		return $http.delete('/api/subscriptions/' + id).then(function (response) {
			_.remove(currentSubscriptions, function (subscription) {
				return subscription._id === id;
			});
			return response.data;
		});
	};

	// -------------------------------------------------------
	// FIXME: Sometimes data retrieved is via ServiceWorker- which ends up being stale.
	CategoriesFactory.getUserFolders = function () {
		return $http.get('/api/folders/user/me').then(function (response) {
			if (response.data !== currentFolders) {
				console.log('User folders retrieved: ', response.data);
				angular.copy(response.data, currentFolders);
			}
			return currentFolders;
		});
	};

	CategoriesFactory.getUserFoldersDetailed = function () {
		return $http.get('/api/folders/user/me?long=true').then(function (response) {
			if (response.data !== currentFoldersDetailed) {
				console.log('Detailed User folders retrieved: ', response.data);
				angular.copy(response.data, currentFoldersDetailed);
			}
			return currentFoldersDetailed;
		});
	};

	CategoriesFactory.createNewFolder = function (name, pageId) {
		var data = { description: name };
		if (pageId) data.page = pageId;

		return $http.post('/api/folders/', data).then(function (response) {
			if (currentFolders.indexOf(response.data) === -1) {
				console.log('New folder added: ', response.data);
				currentFolders.push(response.data);
			}
			return response.data;
		});
	};

	CategoriesFactory.addToFolder = function (categoryId, articleId) {
		var data = { page: articleId };
		return $http.put('/api/folders/' + categoryId, data).then(function (response) {
			var idx = _.chain(currentFolders).pluck('_id').indexOf(categoryId).value();
			if (idx !== -1) {
				if (currentFolders[idx].pages.indexOf(articleId) === -1) {
					console.log('Page added to subscription: ', response.data);
					currentFolders[idx].pages.push(articleId);
				}
			}
			return response.data;
		});
	};

	CategoriesFactory.removeFromFolder = function (categoryId, articleId) {

		return $http.delete('/api/folders/' + categoryId + '/pages/' + articleId).then(function (response) {

			//Get index of category
			var cfIndex = _.chain(currentFolders).pluck('_id').indexOf(categoryId).value();
			var cfdIndex = _.chain(currentFoldersDetailed).pluck('_id').indexOf(categoryId).value();

			//Get index of page in category's 'pages' array
			var cfPageIndex = currentFolders[cfIndex].pages.indexOf(articleId);
			var cfdPageIndex = _.chain(currentFoldersDetailed[cfdIndex].pages).pluck('_id').indexOf(articleId).value();

			//Remove page from index
			currentFolders[cfIndex].pages.splice(cfPageIndex, 1);
			currentFoldersDetailed[cfdIndex].pages.splice(cfdPageIndex, 1);

			return response.data;
		});
	};

	CategoriesFactory.removeFolder = function (id) {
		return $http.delete('/api/folders/' + id).then(function (response) {
			_.remove(currentFolders, function (folder) {
				return folder._id === id;
			});
			return response.data;
		});
	};

	return CategoriesFactory;
});

app.factory('CommentsFactory', function ($http) {
	var CommentsFactory = {};
	var pageCache = {};
	CommentsFactory.fetchAllForPage = function (id) {
		return $http.get('api/comments/page/' + id).then(function (response) {
			if (!pageCache[id]) {
				pageCache[id] = [];
			}
			angular.copy(response.data, pageCache[id]);
			return pageCache[id];
		});
	};

	CommentsFactory.fetchAllForUser = function (id) {
		return $http.get('api/comments/user/' + id).then(function (response) {
			return response.data;
		});
	};

	CommentsFactory.postCommentToArticle = function (id, text) {
		return $http.post('/api/comments/page/' + id, { text: text }).then(function (response) {
			// pageCache[id].comments.push({
			//   text: text,
			//   dateStamp: 'Pending',
			//   user: {
			//     email: 'Pending'
			//   }
			// })
			return response.data;
		});
	};

	CommentsFactory.removeComment = function (id) {
		return $http.delete('/api/comments/' + id).then(function (response) {
			return response.data;
		});
	};

	CommentsFactory.editComment = function (id, text) {
		return $http.put('/api/comments/' + id, { text: text }).then(function (response) {
			return response.data;
		});
	};

	CommentsFactory.vote = function (id, direction) {
		return $http.put('/api/comments/' + id + ('/' + direction + 'vote')).then(function (response) {
			return response.data;
		});
	};

	return CommentsFactory;
});

app.controller('addArticleFormCtrl', function ($mdDialog, ArticlesFactory, CategoriesFactory, Session, folders, subscriptions) {

	this.folders = folders;
	this.subscriptions = subscriptions;

	this.close = function () {
		$mdDialog.cancel();
	};
	this.submit = function (data) {

		console.log("Submitted Article Data: ", data);

		var categoryID = null;
		if (data.secondary) categoryID = data.secondary._id;

		ArticlesFactory.parseUrl(data.primary, Session.user._id, [categoryID]).then(function (response) {
			$mdDialog.hide();
			// $scope.parsed = response;
		});
	};
});

app.controller('addCategoryFormCtrl', function ($mdDialog, CategoriesFactory, Session) {

	this.close = function () {
		$mdDialog.cancel();
	};
	this.submit = function (data) {
		// if type category, send to category api
		// if type url, send to url api

		if (!!data.public) {
			CategoriesFactory.createNewSubscription(data.name).then(function (response) {
				console.log("Successfully created subscription:\n", response);
				$mdDialog.hide();
			});
		} else {
			CategoriesFactory.createNewFolder(data.name).then(function (response) {
				console.log("Successfully created folder:\n", response);
				$mdDialog.hide();
			});
		}
	};
});
app.controller('fileArticleFormCtrl', function ($mdDialog, CategoriesFactory, folders, subscriptions) {

	this.folders = folders;
	this.subscriptions = subscriptions;

	this.close = function () {
		$mdDialog.cancel();
	};

	this.submit = function (articleId, categoryData) {

		// console.log("Submitted Article Data: ", articleId, categoryData);

		if (categoryData.type === 'public') {
			CategoriesFactory.addToSubscription(categoryData._id, articleId).then(function () {
				$mdDialog.hide();
			});
		} else {
			CategoriesFactory.addToFolder(categoryData._id, articleId).then(function () {
				$mdDialog.hide();
			});
		}
	};
});

app.directive('articleDetail', function () {
	return {
		restrict: 'E',
		scope: {
			article: '=',
			removeItemFromFunction: '&?'
		},
		templateUrl: 'app/common/directives/articleDetailCard/detail.html',
		controller: 'ArticleDetailCtrl'
	};
});

app.controller('ArticleDetailCtrl', function ($scope, ArticlesFactory) {

	$scope.addToCollection = function (article) {
		if (article.liked) {
			article.liked = false;
			ArticlesFactory.unfavoriteArticle(article._id).then(function (data) {
				console.log(data);
			});
		} else {
			article.liked = true;
			ArticlesFactory.favoriteArticle(article).then(function (data) {
				console.log(data);
			});
		}
	};

	if (!!$scope.removeItemFromFunction) {
		var partialFunc = $scope.removeItemFromFunction();

		$scope.removeItemFromHere = function (pageId) {
			partialFunc(pageId);
		};
	}
});

app.directive('bindCompiledHtml', ['$compile', function ($compile) {
	return {
		template: '<div></div>',
		scope: {
			rawHtml: '=bindCompiledHtml'
		},
		link: function link(scope, elem) {
			var imgs = [];
			scope.$watch('rawHtml', function (value) {
				if (!value) return;
				var newElem = $compile(value)(scope.$parent);
				elem.contents().remove();
				newElem.find('img').addClass('img-responsive');
				elem.append(newElem);
			});
		}
	};
}]);

app.directive('fullstackLogo', function () {
	return {
		restrict: 'E',
		templateUrl: 'app/common/directives/fullstack-logo/fullstack-logo.html'
	};
});
app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state, $mdSidenav, $mdInkRipple) {

	return {
		restrict: 'E',
		scope: {},
		templateUrl: 'app/common/directives/navbar/navbar.html',
		link: function link(scope, element) {

			scope.toggle = function () {
				$mdSidenav("left").toggle();
			};

			scope.items = [{ label: 'Home', state: 'home' }, { label: 'Parser', state: 'parser' }, { label: 'Pages', state: 'pages' }, { label: 'Members Only', state: 'membersOnly', auth: true }];

			scope.user = null;

			scope.isLoggedIn = function () {
				return AuthService.isAuthenticated();
			};

			scope.logout = function () {
				AuthService.logout().then(function () {
					$state.go('login');
					$rootScope.loggedInUser = null;
				});
			};

			scope.refresh = function () {
				console.log('Reloading UI states...');
				$state.reload();
			};

			var setUser = function setUser() {
				AuthService.getLoggedInUser().then(function (user) {
					scope.user = user;
				});
			};

			var removeUser = function removeUser() {
				scope.user = null;
			};

			setUser();

			$rootScope.$on(AUTH_EVENTS.loginSuccess, setUser);
			$rootScope.$on(AUTH_EVENTS.logoutSuccess, removeUser);
			$rootScope.$on(AUTH_EVENTS.sessionTimeout, removeUser);
		}

	};
});

app.directive('randoGreeting', function (RandomGreetings) {

	return {
		restrict: 'E',
		templateUrl: 'app/common/directives/rando-greeting/rando-greeting.html',
		link: function link(scope) {
			scope.greeting = RandomGreetings.getRandomGreeting();
		}
	};
});
app.directive('sectionsView', function (CategoriesFactory) {
	return {
		restrict: 'E',
		scope: { categories: '=', removeFromFunction: '&?' },
		templateUrl: 'app/common/directives/sections/sections-view.html',

		link: function link(scope) {
			scope.menuUp = function (category) {
				category = category.toLowerCase();
				var menuUpId = '#' + category + '-menu-up';
				var listId = '#' + category;
				if ($(menuUpId).css('transform') !== 'none') {
					$(menuUpId).css("transform", "");
					$(listId).show(400);
				} else {
					$(menuUpId).css("transform", "rotate(180deg)");
					$(listId).hide(400);
				}
			};

			if (!!scope.removeFromFunction) {
				scope.pass = true;
				scope.removeItemFromSection = function (categoryId) {

					return function removePageFromSection(pageId) {
						// console.log("Inner Function with Category: ", categoryId, " & Page: ", pageId);
						return scope.removeFromFunction({ categoryId: categoryId, pageId: pageId });
					};
				};
			} else {
				scope.pass = false;
			}
		}
	};
});

app.directive('sidebar', function (CategoriesFactory) {
	return {
		restrict: 'E',
		scope: {},
		templateUrl: 'app/common/directives/sidebar/sidebar.html',

		link: function link(scope) {

			CategoriesFactory.getUserFolders().then(function (folders) {
				scope.folders = folders;
			});

			CategoriesFactory.getUserSubscriptions().then(function (subscriptions) {
				scope.subscriptions = subscriptions;
			});

			scope.removeFolder = function (id) {
				CategoriesFactory.removeFolder(id).then(function () {
					var index = scope.folders.map(function (element) {
						return element._id;
					}).indexOf(id);

					scope.folders.splice(index, 1);
				});
			};

			scope.removeSubscription = function (id) {
				CategoriesFactory.removeSubscription(id).then(function () {
					var index = scope.subscriptions.map(function (element) {
						return element._id;
					}).indexOf(id);

					scope.subscriptions.splice(index, 1);
				});
			};

			$(".menu-up").click(function () {
				if ($(this).css('transform') !== 'none') {
					$(this).css("transform", "");
					if ($(this).attr('id') === 'subscriptions-icon') $('#subscriptions').show(400);
					if ($(this).attr('id') === 'folders-icon') $('#folders').show(400);
				} else {
					$(this).css("transform", "rotate(180deg)");
					if ($(this).attr('id') === 'subscriptions-icon') $('#subscriptions').hide(400);
					if ($(this).attr('id') === 'folders-icon') $('#folders').hide(400);
				}
			});
		}
	};
});

app.directive('speedDial', function ($mdDialog, $state, $rootScope, CategoriesFactory, ArticlesFactory) {
	return {
		restrict: 'E',
		scope: {},
		templateUrl: '/app/common/directives/speed-dial/speed-dial.html',
		link: function link(scope, element, attribute) {

			scope.$root.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
				var optionsByState = {
					default: {
						isOpen: false,
						count: 0,
						hidden: false,
						hover: false,
						items: [{
							name: "Add URL",
							icon: "/assets/icons/ic_add_white_36px.svg",
							direction: "top",
							action: 'openDialog',
							controller: 'addArticleFormCtrl',
							controllerAs: 'dialog',
							templateUrl: '/app/common/dialogs/article-dialog/article-dialog.html',
							resolve: {
								folders: function folders() {
									return CategoriesFactory.getUserFolders();
								},
								subscriptions: function subscriptions() {
									return CategoriesFactory.getUserSubscriptions();
								}
							}
						}, {
							name: "New Folder / Subscription",
							icon: "/assets/icons/ic_playlist_add_white_36px.svg",
							direction: "bottom",
							action: 'openDialog',
							controller: "addCategoryFormCtrl",
							controllerAs: 'dialog',
							templateUrl: '/app/common/dialogs/category-dialog/category-dialog.html'
						}],
						takeAction: function takeAction($event, item) {
							act($event, item, this);
						}
					},

					article: {
						isOpen: false,
						count: 0,
						hidden: false,
						hover: false,
						items: [{
							name: "Jump to Discussion",
							icon: "/assets/icons/ic_chat_48px.svg",
							direction: "top",
							action: 'openLink',
							goto: "pageComments",
							data: { id: toParams.id }
						}, {
							name: "Add to Collections",
							icon: '/assets/icons/ic_favorite_white_48px.svg',
							direction: "bottom",
							action: 'addFavorite',
							data: { id: toParams.id }
						}, {
							name: "Add to Folder / Subscription",
							icon: '/assets/icons/ic_playlist_add_white_36px.svg',
							direction: "top",
							action: 'openDialog',
							controller: 'fileArticleFormCtrl',
							controllerAs: 'dialog',
							templateUrl: '/app/common/dialogs/filing-dialog/filing-dialog.html',
							resolve: {
								folders: function folders() {
									return CategoriesFactory.getUserFolders();
								},
								subscriptions: function subscriptions() {
									return CategoriesFactory.getUserSubscriptions();
								}
							},
							data: { id: toParams.id }
						}],
						takeAction: function takeAction($event, item) {
							act($event, item, this);
						}
					}
				}; //End optionsByState

				if (optionsByState[toState.name]) {
					for (var key in optionsByState[toState.name]) {
						scope[key] = optionsByState[toState.name][key];
					}
				} else {
					for (var key in optionsByState["default"]) {
						scope[key] = optionsByState["default"][key];
					}
				}
			}); //End $on stateChangeSuccess

			//Actions
			function act($event, item, context) {
				if (item.action === 'openDialog') {
					$mdDialog.show({
						scope: context,
						preserveScope: true,
						clickOutsideToClose: true,
						controller: item.controller,
						controllerAs: item.controllerAs,
						templateUrl: item.templateUrl,
						targetEvent: $event,
						locals: {
							item: item
						},
						resolve: item.resolve

					});
				}

				if (item.action === 'openLink') {
					$state.go(item.goto, item.data);
				}

				if (item.action === 'addFavorite') {
					ArticlesFactory.favoriteArticle(item.data.id);
				}
			}
		} //End link
	};
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5qcyIsImFydGljbGVzL2FydGljbGVzLmpzIiwiY29tbWVudHMvY29tbWVudHMuanMiLCJmb2xkZXJzL2ZvbGRlcnMuanMiLCJmc2EvZnNhLXByZS1idWlsdC5qcyIsImhvbWUvaG9tZS5qcyIsImlkYi9pZGIuanMiLCJsb2dpbi9sb2dpbi5qcyIsIm1lbWJlcnMtb25seS9tZW1iZXJzLW9ubHkuanMiLCJteS1jb2xsZWN0aW9ucy9jb2xsZWN0aW9ucy5qcyIsIm9mZmxpbmUvb2ZmbGluZS5qcyIsInBhcnNlci9wYXJzZXIuanMiLCJzdWJzY3JpcHRpb25zL3N1YnNjcmlwdGlvbnMuanMiLCJjb21tb24vZmFjdG9yaWVzL2FydGljbGVzLmZhY3RvcnkuanMiLCJjb21tb24vZmFjdG9yaWVzL2NhdGVnb3JpZXMuZmFjdG9yeS5qcyIsImNvbW1vbi9mYWN0b3JpZXMvY29tbWVudHMuZmFjdG9yeS5qcyIsImNvbW1vbi9kaWFsb2dzL2FydGljbGUtZGlhbG9nL2FydGljbGUtZGlhbG9nLmpzIiwiY29tbW9uL2RpYWxvZ3MvY2F0ZWdvcnktZGlhbG9nL2NhdGVnb3J5LWRpYWxvZy5qcyIsImNvbW1vbi9kaWFsb2dzL2ZpbGluZy1kaWFsb2cvZmlsaW5nLWRpYWxvZy5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2FydGljbGVEZXRhaWxDYXJkL2RldGFpbC5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2JpbmRDb21waWxlZEh0bWwvYmluZENvbXBpbGVkSHRtbC5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3JhbmRvLWdyZWV0aW5nL3JhbmRvLWdyZWV0aW5nLmpzIiwiY29tbW9uL2RpcmVjdGl2ZXMvc2VjdGlvbnMvc2VjdGlvbnMtdmlldy5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3NpZGViYXIvc2lkZWJhci5qcyIsImNvbW1vbi9kaXJlY3RpdmVzL3NwZWVkLWRpYWwvc3BlZWQtZGlhbC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7QUFFQSxTQUFBLFdBQUEsR0FBQTtBQUNBLFNBQUEsR0FBQSxDQUFBLG1CQUFBO0FBQ0EsUUFBQSxJQUFBLEdBQUEsSUFBQSxDQUFBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsT0FBQSxPQUFBLENBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxVQUFBLE1BQUEsQ0FBQSxHQUFBO0FBQ0EsR0FGQTtBQUdBLEVBSkE7QUFLQTs7QUFFQSxPQUFBLEdBQUEsR0FBQSxRQUFBLE1BQUEsQ0FBQSx1QkFBQSxFQUFBLENBQUEsYUFBQSxFQUFBLFdBQUEsRUFBQSxjQUFBLEVBQUEsV0FBQSxFQUFBLFlBQUEsRUFBQSxZQUFBLENBQUEsQ0FBQTs7QUFFQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGtCQUFBLEVBQUEsaUJBQUEsRUFBQSxrQkFBQSxFQUFBOztBQUVBLG1CQUFBLFNBQUEsQ0FBQSxJQUFBOztBQUVBLG9CQUFBLFNBQUEsQ0FBQSxHQUFBOztBQUVBLG9CQUFBLElBQUEsQ0FBQSxpQkFBQSxFQUFBLFlBQUE7QUFDQSxTQUFBLFFBQUEsQ0FBQSxNQUFBO0FBQ0EsRUFGQTs7QUFJQSxvQkFBQSxLQUFBLENBQUEsU0FBQSxFQUNBLGNBREEsQ0FDQSxXQURBLEVBRUEsYUFGQSxDQUVBLFdBRkE7QUFJQSxDQWRBOzs7QUFpQkEsSUFBQSxHQUFBLENBQUEsVUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7O0FBR0EsS0FBQSwrQkFBQSxTQUFBLDRCQUFBLENBQUEsS0FBQSxFQUFBO0FBQ0EsU0FBQSxNQUFBLElBQUEsSUFBQSxNQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0EsRUFGQTs7Ozs7QUFPQSxhQUFBLGVBQUEsR0FDQSxJQURBLENBQ0EsVUFBQSxZQUFBLEVBQUE7QUFDQSxhQUFBLFlBQUEsR0FBQSxZQUFBO0FBQ0EsRUFIQTs7QUFLQSxZQUFBLEdBQUEsQ0FBQSxt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QSxjQUFBO0FBUkEsRUFBQTtBQVVBLENBWEE7OztBQWNBLElBQUEsVUFBQSxDQUFBLGlCQUFBLEVBQUEsVUFBQSxTQUFBLEVBQUEsTUFBQSxFQUFBLE1BQUEsRUFBQSxlQUFBLEVBQUE7QUFDQSxNQUFBLEtBQUEsR0FBQSxZQUFBO0FBQ0EsWUFBQSxNQUFBO0FBQ0EsRUFGQTs7QUFJQSxNQUFBLE1BQUEsR0FBQSxVQUFBLEtBQUEsRUFBQSxJQUFBLEVBQUE7QUFDQSxNQUFBLFVBQUEsT0FBQSxRQUFBLENBQUEsUUFBQSxDQUFBLEtBQUEsQ0FBQTtBQUNBLGtCQUFBLFdBQUEsQ0FBQSxRQUFBLEdBQUEsRUFBQSxJQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsYUFBQSxJQUFBO0FBQ0EsVUFBQSxRQUFBLENBQUEsUUFBQSxDQUFBLEtBQUEsRUFBQSxJQUFBLEdBQUEsU0FBQSxJQUFBO0FBQ0EsR0FKQTtBQU9BLEVBVEE7QUFVQSxDQWZBOztBQWlCQSxJQUFBLFVBQUEsQ0FBQSxjQUFBLEVBQUEsVUFBQSxNQUFBLEVBQUEsVUFBQSxFQUFBLFlBQUEsRUFBQSxTQUFBLEVBQUEsUUFBQSxFQUFBLGVBQUEsRUFBQSxXQUFBLEVBQUE7QUFDQSxRQUFBLFFBQUEsR0FBQSxRQUFBO0FBQ0EsU0FBQSxHQUFBLENBQUEsZ0JBQUEsRUFBQSxPQUFBLFFBQUE7O0FBRUEsYUFBQSxlQUFBLEdBQ0EsSUFEQSxDQUNBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsU0FBQSxJQUFBLEdBQUEsSUFBQTtBQUNBLFVBQUEsR0FBQSxDQUFBLE1BQUEsRUFBQSxPQUFBLElBQUE7QUFDQSxFQUpBOztBQU1BLFFBQUEsYUFBQSxHQUFBLFlBQUE7QUFDQSxrQkFBQSxvQkFBQSxDQUFBLGFBQUEsRUFBQSxFQUFBLE9BQUEsS0FBQSxFQUNBLElBREEsQ0FDQSxVQUFBLE9BQUEsRUFBQTtBQUNBLFVBQUEsUUFBQSxDQUFBLFFBQUEsQ0FBQSxJQUFBLENBQUEsT0FBQTtBQUNBLEdBSEE7QUFJQSxFQUxBOztBQU9BLFFBQUEs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QUFBLENBQUEsS0FBQSxFQUFBLEVBQUEsS0FBQSxJQUFBO0FBQ0EsY0FBQSxVQUFBLENBQUEsWUFBQSxZQUFBO0FBQ0EsVUFBQSxLQUFBLElBQUE7QUFDQTs7OztBQUlBLE9BQUEsZUFBQSxHQUFBLFlBQUE7QUFDQSxVQUFBLENBQUEsQ0FBQSxRQUFBLElBQUE7QUFDQSxHQUZBOztBQUlBLE9BQUEsZUFBQSxHQUFBLFVBQUEsVUFBQSxFQUFBOzs7Ozs7Ozs7O0FBVUEsT0FBQSxLQUFBLGVBQUEsTUFBQSxlQUFBLElBQUEsRUFBQTtBQUNBLFdBQUEsR0FBQSxJQUFBLENBQUEsUUFBQSxJQUFBLENBQUE7QUFDQTs7Ozs7QUFLQSxVQUFBLE1BQUEsR0FBQSxDQUFBLFVBQUEsRUFBQSxJQUFBLENBQUEsaUJBQUEsRUFBQSxLQUFBLENBQUEsWUFBQTtBQUNBLFdBQUEsSUFBQTtBQUNBLElBRkEsQ0FBQTtBQUlBLEdBckJBOztBQXVCQSxPQUFBLEtBQUEsR0FBQSxVQUFBLFdBQUEsRUFBQTtBQUNBLFVBQUEsTUFBQSxJQUFBLENBQUEsUUFBQSxFQUFBLFdBQUEsRUFDQSxJQURBLENBQ0EsaUJBREEsRUFFQSxLQUZBLENBRUEsWUFBQTtBQUNBLFdBQUEsR0FBQSxNQUFBLENBQUEsRUFBQSxTQUFBLDRCQUFBLEVBQUEsQ0FBQTtBQUNBLElBSkEsQ0FBQTtBQUtBLEdBTkE7O0FBUUEsT0FBQSxNQUFBLEdBQUEsWUFBQTtBQUNBLFVBQUEsTUFBQSxHQUFBLENBQUEsU0FBQSxFQUFBLElBQUEsQ0FBQSxZQUFBO0FBQ0EsWUFBQSxPQUFBO0FBQ0EsZUFBQSxVQUFBLENBQUEsWUFBQSxhQUFBO0FBQ0EsSUFIQSxDQUFBO0FBSUEsR0FMQTtBQU9BLEVBckRBOztBQXVEQSxLQUFBLE9BQUEsQ0FBQSxTQUFBLEVBQUEsVUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBOztBQUVBLE1BQUEsT0FBQSxJQUFBOztBQUVBLGFBQUEsR0FBQSxDQUFBLFlBQUEsZ0JBQUEsRUFBQSxZQUFBO0FBQ0EsUUFBQSxPQUFBO0FBQ0EsR0FGQTs7QUFJQSxhQUFBLEdBQUEsQ0FBQSxZQUFBLGNBQUEsRUFBQSxZQUFBO0FBQ0EsUUFBQSxPQUFBO0FBQ0EsR0FGQTs7QUFJQSxPQUFBLEVBQUEsR0FBQSxJQUFBO0FBQ0EsT0FBQSxJQUFBLEdBQUEsSUFBQTs7QUFFQSxPQUFBLE1BQUEsR0FBQSxVQUFBLFNBQUEsRUFBQSxJQUFBLEVBQUE7QUFDQSxRQUFBLEVBQUEsR0FBQSxTQUFBO0FBQ0EsUUFBQSxJQUFBLEdBQUEsSUFBQTtBQUNBLEdBSEE7O0FBS0EsT0FBQSxPQUFBLEdBQUEsWUFBQTtBQUNBLFFBQUEsRUFBQSxHQUFBLElBQUE7QUFDQSxRQUFBLElBQUEsR0FBQSxJQUFBO0FBQ0EsR0FIQTtBQUtBLEVBekJBO0FBMkJBLENBcklBOztBQ0FBLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBLGtCQUFBLEVBQUE7QUFDQSxnQkFBQSxLQUFBLENBQUEsTUFBQSxFQUFBO0FBQ0EsT0FBQSxPQURBO0FBRUEsZUFBQSxvQkFGQTtBQUdBLFdBQUE7QUFDQSxTQUFBLGNBQUEsV0FBQSxFQUFBO0FBQ0EsV0FBQSxZQUFBLGVBQUEsRUFBQTtBQUNBLElBSEE7Ozs7QUFPQSxhQUFBLGtCQUFBLGVBQUEsRUFBQTtBQUNBLFdBQUEsZ0JBQUEsUUFBQSxFQUFBO0FBQ0E7QUFUQSxHQUhBO0FBY0EsY0FBQTtBQWRBLEVBQUE7QUFnQkEsb0JBQUEsSUFBQSxDQUFBLEdBQUEsRUFBQSxPQUFBO0FBRUEsQ0FuQkE7O0FBcUJBLElBQUEsVUFBQSxDQUFBLGNBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxVQUFBLEVBQUEsSUFBQSxFQUFBLFFBQUEsRUFBQSxNQUFBLEVBQUE7QUFDQSxRQUFBLElBQUEsR0FBQSxJQUFBO0FBQ0EsUUFBQSxRQUFBLEdBQUEsUUFBQTs7QUFFQSxRQUFBLFlBQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLFNBQUEsRUFBQSxDQUFBLFNBQUEsRUFBQTtBQUNBLE9BQUE7QUFEQSxHQUFBO0FBR0EsRUFKQTs7QUFPQSxRQUFBLEtBQUEsR0FBQSxlQUFBO0FBQ0EsTUFBQSxFQURBO0FBRUEsU0FBQSxFQUZBO0FBR0EsU0FBQTtBQUhBLEVBQUEsQ0FBQTs7QUFNQSxVQUFBLGNBQUEsQ0FBQSxRQUFBLEVBQUE7QUFDQSxNQUFBLEVBQUE7TUFBQSxVQUFBLEVBQUE7QUFDQSxPQUFBLElBQUEsSUFBQSxDQUFBLEVBQUEsSUFBQSxFQUFBLEVBQUEsR0FBQSxFQUFBO0FBQ0EsT0FBQSxVQUFBLFNBQUEsS0FBQSxLQUFBLENBQUEsU0FBQSxNQUFBLEdBQUEsS0FBQSxNQUFBLEVBQUEsQ0FBQSxDQUFBO0FBQ0EsUUFBQSxRQUFBLE1BQUEsQ0FBQSxFQUFBLEVBQUEsUUFBQSxDQUFBO0FBQ0EsTUFBQSxHQUFBLEdBQUEsUUFBQSxHQUFBO0FBQ0EsTUFBQSxLQUFBLEdBQUEsUUFBQSxLQUFBO0FBQ0EsTUFBQSxJQUFBLEdBQUE7QUFDQSxTQUFBLENBREE7QUFFQSxTQUFBO0FBRkEsSUFBQTtBQUlBLE1BQUEsS0FBQSxHQUFBLFFBQUEsWUFBQTtBQUNBLFdBQUEsSUFBQSxDQUFBO0FBQ0EsU0FBQSxDQUFBO0FBQ0EsUUFBQSxJQUFBLENBQUEsR0FBQSxHQUFBLEdBQUEsSUFBQSxDQUFBLEdBQUEsR0FBQSxDQUFBO0FBQ0E7QUFDQSxTQUFBLENBQUE7QUFDQSxRQUFBLElBQUEsQ0FBQSxHQUFBLEdBQUEsQ0FBQTtBQUNBO0FBQ0EsU0FBQSxDQUFBO0FBQ0EsUUFBQSxJQUFBLENBQUEsR0FBQSxHQUFBLEdBQUEsSUFBQSxDQUFBLEdBQUEsR0FBQSxDQUFBO0FBQ0E7QUFUQTtBQVdBLFdBQUEsSUFBQSxDQUFBLEVBQUE7QUFDQTtBQUNBLFNBQUEsT0FBQTtBQUNBO0FBRUEsQ0E3Q0E7O0FDckJBLENBQUEsWUFBQTs7O0FBR0EsS0FBQSxDQUFBLE9BQUEsT0FBQSxFQUFBLE1BQUEsSUFBQSxLQUFBLENBQUEsa0JBQUEsQ0FBQTtBQUNBLEtBQUEsTUFBQSxRQUFBLE1BQUEsQ0FBQSxVQUFBLEVBQUEsRUFBQSxDQUFBOztBQUVBLEtBQUEsT0FBQSxDQUFBLFlBQUEsRUFBQSxVQUFBLElBQUEsRUFBQSxFQUFBLEVBQUE7QUFDQSxVQUFBLEdBQUEsQ0FBQSxzQkFBQTtBQUNBLE1BQUEsQ0FBQSxPQUFBLEtBQUEsRUFBQSxNQUFBLElBQUEsS0FBQSxDQUFBLGlCQUFBLENBQUE7QUFDQSxNQUFBLEtBQUEsSUFBQSxLQUFBLENBQUEsUUFBQSxDQUFBOztBQUVBLEtBQUEsT0FBQSxDQUFBLENBQUEsRUFBQSxNQUFBLENBQUE7QUFDQSxlQUFBLGlDQURBO0FBRUEsU0FBQTtBQUZBLEdBQUE7O0FBS0EsS0FBQSxJQUFBLEdBQUEsSUFBQSxDQUFBLFlBQUE7QUFDQSxNQUFBLEtBQUE7QUFDQSxNQUFBLElBQUEsR0FBQSxJQUFBLENBQUEsWUFBQTtBQUNBLFNBQUEsS0FBQSxDQUFBLGlDQUFBO0FBQ0EsSUFGQTtBQUdBLEdBTEE7O0FBT0EsS0FBQSxFQUFBLENBQUEsU0FBQSxFQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsUUFBQSxJQUFBLENBQUEsVUFBQSxFQUFBLEdBQUE7QUFDQSxHQUZBOztBQUlBLFNBQUE7QUFDQSxXQUFBLGtCQUFBO0FBQ0EsV0FBQSxLQUFBO0FBQ0EsSUFIQTtBQUlBLFlBQUEsaUJBQUEsS0FBQSxFQUFBLEVBQUEsRUFBQTtBQUNBLFFBQUEsV0FBQSxHQUFBLEtBQUEsRUFBQTtBQUNBLE9BQUEsSUFBQSxDQUFBLEdBQUEsQ0FBQSxLQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsSUFBQSxFQUFBO0FBQ0EsY0FBQSxPQUFBLENBQUEsSUFBQTtBQUNBLEtBSEE7QUFJQSxXQUFBLFNBQUEsT0FBQTtBQUNBO0FBWEEsR0FBQTtBQWFBLEVBbENBO0FBb0NBLENBMUNBOztBQ0FBLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBOztBQUVBLGdCQUFBLEtBQUEsQ0FBQSxPQUFBLEVBQUE7QUFDQSxPQUFBLFFBREE7QUFFQSxlQUFBLHNCQUZBO0FBR0EsY0FBQTtBQUhBLEVBQUE7QUFNQSxDQVJBOztBQVVBLElBQUEsVUFBQSxDQUFBLFdBQUEsRUFBQSxVQUFBLE1BQUEsRUFBQSxVQUFBLEVBQUEsV0FBQSxFQUFBLE1BQUEsRUFBQTs7QUFFQSxRQUFBLEtBQUEsR0FBQSxFQUFBO0FBQ0EsUUFBQSxLQUFBLEdBQUEsSUFBQTs7QUFFQSxRQUFBLFNBQUEsR0FBQSxVQUFBLFNBQUEsRUFBQTs7QUFFQSxTQUFBLEtBQUEsR0FBQSxJQUFBOztBQUVBLGNBQUEsS0FBQSxDQUFBLFNBQUEsRUFBQSxJQUFBLENBQUEsVUFBQSxZQUFBLEVBQUE7QUFDQSxVQUFBLEVBQUEsQ0FBQSxNQUFBO0FBQ0EsY0FBQSxZQUFBLEdBQUEsWUFBQTtBQUNBLFdBQUEsR0FBQSxDQUFBLFdBQUEsWUFBQTtBQUNBLEdBSkEsRUFJQSxLQUpBLENBSUEsWUFBQTtBQUNBLFVBQUEsS0FBQSxHQUFBLDRCQUFBO0FBQ0EsR0FOQTtBQVFBLEVBWkE7QUFjQSxDQW5CQTtBQ1ZBLElBQUEsTUFBQSxDQUFBLFVBQUEsY0FBQSxFQUFBOztBQUVBLGdCQUFBLEtBQUEsQ0FBQSxhQUFBLEVBQUE7QUFDQSxPQUFBLGVBREE7QUFFQSxZQUFBLG1FQUZBO0FBR0EsY0FBQSxvQkFBQSxNQUFBLEVBQUEsV0FBQSxFQUFBO0FBQ0EsZUFBQSxRQUFBLEdBQUEsSUFBQSxDQUFBLFVBQUEsS0FBQSxFQUFBO0FBQ0EsV0FBQSxLQUFBLEdBQUEsS0FBQTtBQUNBLElBRkE7QUFHQSxHQVBBOzs7QUFVQSxRQUFBO0FBQ0EsaUJBQUE7QUFEQTtBQVZBLEVBQUE7QUFlQSxDQWpCQTs7QUFtQkEsSUFBQSxPQUFBLENBQUEsYUFBQSxFQUFBLFVBQUEsS0FBQSxFQUFBOztBQUVBLEtBQUEsV0FBQSxTQUFBLFFBQUEsR0FBQTtBQUNBLFNBQUEsTUFBQSxHQUFBLENBQUEsMkJBQUEsRUFBQSxJQUFBLENBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxVQUFBLFNBQUEsSUFBQTtBQUNBLEdBRkEsQ0FBQTtBQUdBLEVBSkE7O0FBTUEsUUFBQTtBQUNBLFlBQUE7QUFEQSxFQUFBO0FBSUEsQ0FaQTtBQ25CQSxJQUFBLE1BQUEsQ0FBQSxVQUFBLGNB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Q0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxPQUFBLHFCQUFBLFNBQUEsSUFBQSxFQUFBO0FBQ0EsWUFBQSxJQUFBLENBQUEsU0FBQSxJQUFBLEVBQUEsZ0JBQUE7QUFDQTtBQUNBLFVBQUEsZ0JBQUE7QUFDQSxHQU5BLENBQUE7QUFPQSxFQVJBOztBQVVBLGlCQUFBLHdCQUFBLEdBQUEsWUFBQTtBQUNBLFNBQUEsTUFBQSxHQUFBLENBQUEsd0JBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxPQUFBLDZCQUFBLFNBQUEsSUFBQSxFQUFBO0FBQ0EsWUFBQSxJQUFBLENBQUEsU0FBQSxJQUFBLEVBQUEsd0JBQUE7QUFDQTtBQUNBLFVBQUEsd0JBQUE7QUFDQSxHQU5BLEVBT0EsS0FQQSxDQU9BLFVBQUEsR0FBQSxFQUFBO0FBQ0EsVUFBQSxFQUFBLENBQUEsVUFBQTtBQUNBLEdBVEEsQ0FBQTtBQVVBLEVBWEE7OztBQWNBLGlCQUFBLGtCQUFBLEdBQUEsVUFBQSxHQUFBLEVBQUE7QUFDQSxNQUFBLFlBQUEsc0JBQUE7QUFDQSxPQUFBLElBQUEsR0FBQSxJQUFBLEdBQUEsRUFBQTtBQUNBLE9BQUEsaUJBQUEsTUFBQSxHQUFBLEdBQUEsSUFBQSxHQUFBLENBQUE7QUFDQSxnQkFBQSxjQUFBO0FBQ0E7O0FBRUEsU0FBQSxNQUFBLEdBQUEsQ0FBQSxTQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsVUFBQSxTQUFBLElBQUE7QUFDQSxHQUhBLENBQUE7QUFJQSxFQVhBOztBQWFBLGlCQUFBLGVBQUEsR0FBQSxZQUFBO0FBQ0EsU0FBQSxNQUFBLEdBQUEsQ0FBQSxrQkFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFFBQUEsRUFBQTtBQUNBLFdBQUEsR0FBQSxDQUFBLGdCQUFBLEVBQUEsU0FBQSxJQUFBO0FBQ0EsVUFBQSxTQUFBLElBQUE7QUFDQSxHQUpBLEVBS0EsS0FMQSxDQUtBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsV0FBQSxHQUFBLENBQUEsaUJBQUEsRUFBQSxHQUFBO0FBQ0EsR0FQQSxDQUFBO0FBU0EsRUFWQTs7QUFZQSxpQkFBQSxnQkFBQSxHQUFBLFVBQUEsRUFBQSxFQUFBO0FBQ0EsU0FBQSxNQUFBLEdBQUEsQ0FBQSxnQkFBQSxFQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsVUFBQSxTQUFBLElBQUE7QUFDQSxHQUhBLEVBSUEsS0FKQSxDQUlBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsV0FBQSxHQUFBLENBQUEsdURBQUEsRUFBQSxHQUFBO0FBQ0EsT0FBQSxlQUFBLEVBQUEsSUFBQSxDQUFBLGdCQUFBLEVBQUEsVUFBQSxPQUFBLEVBQUE7QUFDQSxXQUFBLFFBQUEsR0FBQSxLQUFBLEVBQUE7QUFDQSxJQUZBLENBQUE7QUFHQSxXQUFBLEdBQUEsQ0FBQSxZQUFBO0FBQ0EsVUFBQSxZQUFBO0FBQ0EsR0FYQSxDQUFBO0FBWUEsRUFiQTs7QUFnQkEsaUJBQUEsb0JBQUEsR0FBQSxVQUFBLEdBQUEsRUFBQSxRQUFBLEVBQUE7O0FBRUEsRUFGQTs7QUFNQSxpQkFBQSxnQkFBQSxHQUFBLFVBQUEsR0FBQSxFQUFBLFFBQUEsRUFBQSxDQUVBOzs7OztBQUZBLEVBS0EsZ0JBQUEsc0JBQUEsR0FBQSxZQUFBO0FBQ0EsU0FBQSxNQUFBLEdBQUEsQ0FBQSxtQkFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFFBQUEsRUFBQTtBQUNBLE9BQUEsU0FBQSxJQUFBLEtBQUEsaUJBQUEsRUFBQTtBQUNBLFlBQUEsSUFBQSxDQUFBLFNBQUEsSUFBQSxFQUFBLGlCQUFBO0FBQ0E7QUFDQSxVQUFBLGlCQUFBO0FBQ0EsR0FOQSxDQUFBO0FBT0EsRUFSQTs7QUFVQSxpQkFBQSwwQkFBQSxHQUFBLFlBQUE7QUFDQSxTQUFBLE1BQUEsR0FBQSxDQUFBLGNBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxXQUFBLElBQUEsQ0FBQSxTQUFBLElBQUEsQ0FBQSxLQUFBLEVBQUEsaUJBQUE7QUFDQSxVQUFBLGlCQUFBO0FBQ0EsR0FKQSxFQUtBLEtBTEEsQ0FLQSxVQUFBLEdBQUEsRUFBQTtBQUNBLFdBQUEsR0FBQSxDQUFBLGdEQUFBO0FBQ0EsVUFBQSxpQkFBQTtBQUNBLEdBUkEsQ0FBQTtBQVNBLEVBVkE7OztBQWFBLGlCQUFBLGVBQUEsR0FBQSxVQUFBLE9BQUEsRUFBQTtBQUNBLE1BQUEsR0FBQTtBQUNBLE1BQUEsT0FBQSxPQUFBLEtBQUEsUUFBQSxFQUFBO0FBQ0EsU0FBQSxFQUFBLElBQUEsQ0FBQSxnQkFBQSxFQUFBLFVBQUEsR0FBQSxFQUFBO0FBQ0EsV0FBQSxJQUFBLEdBQUEsS0FBQSxPQUFBO0FBQ0EsSUFGQSxDQUFBO0FBR0EsR0FKQSxNQUlBO0FBQ0EsU0FBQSxPQUFBO0FBQ0E7QUFDQSxTQUFBLE1BQUEsR0FBQSxDQUFBLGVBQUEsSUFBQSxHQUFBLEdBQUEsV0FBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFFBQUEsRUFBQTtBQUNBLFdBQUEsR0FBQSxDQUFBLG9CQUFBO0FBQ0EscUJBQUEsSUFBQSxDQUFBLEdBQUE7QUFDQSxVQUFBLFNBQUEsSUFBQTtBQUNBLEdBTEEsQ0FBQTtBQU1BLEVBZkE7O0FBaUJBLGlCQUFBLGlCQUFBLEdBQUEsVUFBQSxFQUFBLEVBQUE7QUFDQSxTQUFBLE1BQUEsR0FBQSxDQUFBLGVBQUEsRUFBQSxHQUFBLGFBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxLQUFBLE1BQUEsQ0FBQSxpQkFBQSxFQUFBLFVBQUEsT0FBQSxFQUFBO0FBQ0EsV0FBQSxPQUFBLFFBQUEsR0FBQTtBQUNBLElBRkE7QUFHQSxXQUFBLEdBQUEsQ0FBQSxTQUFBLEVBQUEsaUJBQUE7QUFDQSxVQUFBLFNBQUEsSUFBQTtBQUNBLEdBUEEsQ0FBQTtBQVFBLEVBVEE7Ozs7Ozs7Ozs7QUFtQkEsaUJBQUEsUUFBQSxHQUFBLFVBQUEsR0FBQSxFQUFBLE1BQUEsRUFBQSxVQUFBLEVBQUE7Ozs7OztBQU1BLE1BQUEsVUFBQSxtQkFBQSxHQUFBLENBQUE7QUFDQSxTQUFBLE1BQUEsR0FBQSxDQUFBLGlCQUFBLE9BQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxNQUFBLEVBQUE7O0FBRUEsVUFBQSxNQUFBLElBQUEsQ0FBQSxZQUFBLEVBQUEsT0FBQSxJQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsWUFBQSxFQUFBOztBQUVBLFdBQUEsTUFBQSxHQUFBLENBQUEsd0JBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxhQUFBLElBQUEsQ0FBQTtBQURBLEtBQUEsRUFHQSxJQUhBLENBR0EsVUFBQSxHQUFBLEVBQUE7QUFDQSxTQUFBLFVBQUEsRUFBQTtBQUNBLFVBQUEsV0FBQSxFQUFBO0FBQ0EsV0FBQSxJQUFBLElBQUEsQ0FBQSxFQUFBLElBQUEsV0FBQSxNQUFBLEVBQUEsR0FBQSxFQUFBOztBQUVBLGdCQUFBLElBQUEsQ0FBQSxNQUFBLEdBQUEsQ0FBQSw2QkFBQSxXQUFBLENBQUEsQ0FBQSxFQUFBO0FBQ0EsY0FBQSxhQUFBLElBQUEsQ0FBQTtBQURBLFFBQUEsQ0FBQTtBQUdBO0FBQ0EsY0FBQSxHQUFBLENBQUEsWUFBQSxFQUFBLFFBQUE7QUFDQSxhQUFBLFFBQUEsR0FBQSxDQUFBLFFBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxlQUFBLEdBQUEsQ0FBQSx3QkFBQTtBQUNBLFdBQUEsQ0FBQSx1QkFBQSxhQUFBLElBQUEsQ0FBQSxHQUFBLENBQUEsRUFBQTtBQUNBLGdCQUFBLEdBQUEsQ0FBQSx5QkFBQTtBQUNBLHFCQUFBLElBQUEsQ0FBQSxLQUFBLEdBQUEsSUFBQTtBQUNBLDBCQUFBLElBQUEsQ0FBQSxhQUFBLElBQUE7QUFDQTtBQUNBLGNBQUEsYUFBQSxJQUFBO0FBQ0EsT0FUQSxDQUFBO0FBVUEsTUFuQkEsTUFtQkE7O0FBRUEsY0FBQSxHQUFBLENBQUEsa0JBQUEsRUFBQSxhQUFBLElBQUE7QUFDQSxVQUFBLENBQUEsdUJBQUEsYUFBQSxJQUFBLENBQUEsR0FBQSxDQUFBLEVBQUE7QUFDQSxlQUFBLEdBQUEsQ0FBQSx5QkFBQTtBQUNBLG9CQUFBLElBQUEsQ0FBQSxLQUFBLEdBQUEsSUFBQTtBQUNBLHlCQUFBLElBQUEsQ0FBQSxhQUFBLElBQUE7QUFDQTtBQUNBLGFBQUEsYUFBQSxJQUFBO0FBQ0E7QUFDQSxLQWpDQSxDQUFBO0FBa0NBLElBckNBLENBQUE7QUFzQ0EsR0F6Q0EsQ0FBQTtBQTBDQSxFQWpEQTs7QUFtREEsVUFBQSxzQkFBQSxDQUFBLEVBQUEsRUFBQTtBQUNBLFNBQUEsRUFBQSxRQUFBLENBQUEsaUJBQUEsRUFBQSxVQUFBLE9BQUEsRUFBQTtBQUNBLFVBQUEsUUFBQSxHQUFBLEtBQUEsRUFBQTtBQUNBLEdBRkEsQ0FBQTtBQUdBOztBQUVBLFFBQUEsZUFBQTtBQUNBLENBeE1BOztBQ0FBLElBQUEsT0FBQSxDQUFBLG1CQUFBLEVBQUEsVUFBQSxLQUFBLEVBQUE7QUFDQSxLQUFBLG9CQUFBLEVBQUE7QUFDQSxLQUFBLHVCQUFBLEVBQUE7QUFDQSxLQUFBLCtCQUFBLEVBQUE7QUFDQSxLQUFBLHlCQUFBLEVBQUE7QUFDQSxLQUFBLGlCQUFBLEVBQUE7O0FBRUEsbUJBQUEsb0JBQUEsR0FBQSxZQUFBO0FBQ0EsU0FBQSxNQUFBLEdBQUEsQ0FBQSw0QkFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFFBQUEsRUFBQTtBQUNBLE9BQUEsU0FBQSxJQUFBLEtBQUEsb0JBQUEsRUFBQTtBQUNBLFlBQUEsR0FBQSxDQUFBLGdDQUFBLEVBQUEsU0FBQSxJQUFBO0FBQ0EsWUFBQSxJQUFBLENBQUEsU0FBQSxJQUFBLEVBQUEsb0JBQUE7QUFDQTtBQUNBLFVBQUEsb0JBQUE7QUFDQSxHQVBBLENBQUE7QUFRQSxFQVRBOztBQVdBLG1CQUFBLDRCQUFBLEdBQUEsWUFBQTtBQUNBLFNBQUEsTUFBQSxHQUFBLENBQUEsc0NBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxPQUFBLFNBQUEsSUFBQSxLQUFBLDRCQUFBLEVBQUE7QUFDQSxZQUFBLEdBQUEsQ0FBQSxvQ0FBQSxFQUFBLFNBQUEsSUFBQTtBQUNBLFlBQUEsSUFBQSxDQUFBLFNBQUEsSUFBQSxFQUFBLDRCQUFBO0FBQ0E7QUFDQSxVQUFBLDRCQUFBO0FBQ0EsR0FQQSxDQUFBO0FBUUEsRUFUQTs7O0FBWUEsbUJBQUEscUJBQUEsR0FBQSxVQUFBLElBQUEsRUFBQSxNQUFBLEVBQUE7QUFDQSxNQUFBLE9BQUEsRUFBQSxhQUFBLElBQUEsRUFBQTtBQUNBLE1BQUEsTUFBQSxFQUFBLEtBQUEsSUFBQSxHQUFBLE1BQUE7O0FBRUEsU0FBQSxNQUFBLElBQUEsQ0FBQSxxQkFBQSxFQUFBLElBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxPQUFBLHFCQUFBLE9BQUEsQ0FBQSxTQUFBLElBQUEsTUFBQSxDQUFBLENBQUEsRUFBQTtBQUNBLFlBQUEsR0FBQSxDQUFBLDBCQUFBLEVBQUEsU0FBQSxJQUFBO0FBQ0EseUJBQUEsSUFBQSxDQUFBLFNBQUEsSUFBQTtBQUNBO0FBQ0EsVUFBQSxTQUFBLElBQUE7QUFDQSxHQVBBLENBQUE7QUFRQSxFQVpBOzs7QUFlQSxtQkFBQSxpQkFBQSxHQUFBLFVBQUEsVUFBQSxFQUFBLFNBQUEsRUFBQTtBQUNBLE1BQUEsT0FBQSxFQUFBLE1BQUEsU0FBQSxFQUFBO0FBQ0EsU0FBQSxNQUFBLEdBQUEsQ0FBQSx3QkFBQSxVQUFBLEVBQUEsSUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFFBQUEsRUFBQTtBQUNBLE9BQUEsTUFBQSxFQUFBLEtBQUEsQ0FBQSxvQkFBQSxFQUFBLEtBQUEsQ0FBQSxLQUFBLEVBQUEsT0FBQSxDQUFBLFVBQUEsRUFBQSxLQUFBLEVBQUE7QUFDQSxPQUFBLFFBQUEsQ0FBQSxDQUFBLEVBQUE7QUFDQSxRQUFBLHFCQUFBLEdBQUEsRUFBQSxLQUFBLENBQUEsT0FBQSxDQUFBLFNBQUEsTUFBQSxDQUFBLENBQUEsRUFBQTtBQUNBLGFBQUEsR0FBQSxDQUFBLDhCQUFBLEVBQUEsU0FBQSxJQUFBO0FBQ0EsMEJBQUEsR0FBQSxFQUFBLEtBQUEsQ0FBQSxJQUFBLENBQUEsU0FBQTtBQUNBO0FBQ0E7QUFDQSxVQUFBLFNBQUEsSUFBQTtBQUNBLEdBVkEsQ0FBQTtBQVdBLEVBYkE7O0FBZUEsbUJBQUEsc0JBQUEsR0FBQSxVQUFBLFVBQUEsRUFBQSxTQUFBLEVBQUE7QUFDQSxTQUFBLE1BQUEsTUFBQSxDQUFBLHdCQUFBLFVBQUEsR0FBQSxTQUFBLEdBQUEsU0FBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFFBQUEsRUFBQTs7O0FBR0EsT0FBQSxVQUFBLEVBQUEsS0FBQSxDQUFBLG9CQUFBLEVBQUEsS0FBQSxDQUFBLEtBQUEsRUFBQSxPQUFBLENBQUEsVUFBQSxFQUFBLEtBQUEsRUFBQTtBQUNBLE9BQUEsV0FBQSxFQUFBLEtBQUEsQ0FBQSw0QkFBQSxFQUFBLEtBQUEsQ0FBQSxLQUFBLEVBQUEsT0FBQSxDQUFBLFVBQUEsRUFBQSxLQUFBLEVBQUE7OztBQUdBLE9BQUEsY0FBQSxxQkFBQSxPQUFBLEVBQUEsS0FBQSxDQUFBLE9BQUEsQ0FBQSxTQUFBLENBQUE7QUFDQSxPQUFBLGVBQUEsRUFBQSxLQUFBLENBQUEsNkJBQUEsUUFBQSxFQUFBLEtBQUEsRUFBQSxLQUFBLENBQUEsS0FBQSxFQUFBLE9BQUEsQ0FBQSxTQUFBLEVBQUEsS0FBQSxFQUFBOzs7QUFHQSx3QkFBQSxPQUFBLEVBQUEsS0FBQSxDQUFBLE1BQUEsQ0FBQSxXQUFBLEVBQUEsQ0FBQTtBQUNBLGdDQUFBLFFBQUEsRUFBQSxLQUFBLENBQUEsTUFBQSxDQUFBLFlBQUEsRUFBQSxDQUFBOztBQUVBLFVBQUEsU0FBQSxJQUFBO0FBQ0EsR0FoQkEsQ0FBQTtBQWlCQSxFQWxCQTs7O0FBcUJBLG1CQUFBLGtCQUFBLEdBQUEsVUFBQSxFQUFBLEVBQUE7QUFDQSxTQUFBLE1BQUEsTUFBQSxDQUFBLHdCQUFBLEVBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxLQUFBLE1BQUEsQ0FBQSxvQkFBQSxFQUFBLFVBQUEsWUFBQSxFQUFBO0FBQ0EsV0FBQSxhQUFBLEdBQUEsS0FBQSxFQUFBO0FBQ0EsSUFGQTtBQUdBLFVBQUEsU0FBQSxJQUFBO0FBQ0EsR0FOQSxDQUFBO0FBT0EsRUFSQTs7OztBQVlBLG1CQUFBLGNBQUEsR0FBQSxZQUFBO0FBQ0EsU0FBQSxNQUFBLEdBQUEsQ0FBQSxzQkFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFFBQUEsRUFBQTtBQUNBLE9BQUEsU0FBQSxJQUFBLEtBQUEsY0FBQSxFQUFBO0FBQ0EsWUFBQSxHQUFBLENBQUEsMEJBQUEsRUFBQSxTQUFBLElBQUE7QUFDQSxZQUFBLElBQUEsQ0FBQSxTQUFBLElBQUEsRUFBQSxjQUFBO0FBQ0E7QUFDQSxVQUFBLGNBQUE7QUFDQSxHQVBBLENBQUE7QUFRQSxFQVRBOztBQVdBLG1CQUFBLHNCQUFBLEdBQUEsWUFBQTtBQUNBLFNBQUEsTUFBQSxHQUFBLENBQUEsZ0NBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxPQUFBLFNBQUEsSUFBQSxLQUFBLHNCQUFBLEVBQUE7QUFDQSxZQUFBLEdBQUEsQ0FBQSxtQ0FBQSxFQUFBLFNBQUEsSUFBQTtBQUNBLFlBQUEsSUFBQSxDQUFBLFNBQUEsSUFBQSxFQUFBLHNCQUFBO0FBQ0E7QUFDQSxVQUFBLHNCQUFBO0FBQ0EsR0FQQSxDQUFBO0FBUUEsRUFUQTs7QUFXQSxtQkFBQSxlQUFBLEdBQUEsVUFBQSxJQUFBLEVBQUEsTUFBQSxFQUFBO0FBQ0EsTUFBQSxPQUFBLEVBQUEsYUFBQSxJQUFBLEVBQUE7QUFDQSxNQUFBLE1BQUEsRUFBQSxLQUFBLElBQUEsR0FBQSxNQUFBOztBQUVBLFNBQUEsTUFBQSxJQUFBLENBQUEsZUFBQSxFQUFBLElBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7QUFDQSxPQUFBLGVBQUEsT0FBQSxDQUFBLFNBQUEsSUFBQSxNQUFBLENBQUEsQ0FBQSxFQUFBO0FBQ0EsWUFBQSxHQUFBLENBQUEsb0JBQUEsRUFBQSxTQUFBLElBQUE7QUFDQSxtQkFBQSxJQUFBLENBQUEsU0FBQSxJQUFBO0FBQ0E7QUFDQSxVQUFBLFNBQUEsSUFBQTtBQUNBLEdBUEEsQ0FBQTtBQVFBLEVBWkE7O0FBY0EsbUJBQUEsV0FBQSxHQUFBLFVBQUEsVUFBQSxFQUFBLFNBQUEsRUFBQTtBQUNBLE1BQUEsT0FBQSxFQUFBLE1BQUEsU0FBQSxFQUFBO0FBQ0EsU0FBQSxNQUFBLEdBQUEsQ0FBQSxrQkFBQSxVQUFBLEVBQUEsSUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFFBQUEsRUFBQTtBQUNBLE9BQUEsTUFBQSxFQUFBLEtBQUEsQ0FBQSxjQUFBLEVBQUEsS0FBQSxDQUFBLEtBQUEsRUFBQSxPQUFBLENBQUEsVUFBQSxFQUFBLEtBQUEsRUFBQTtBQUNBLE9BQUEsUUFBQSxDQUFBLENBQUEsRUFBQTtBQUNBLFFBQUEsZUFBQSxHQUFBLEVBQUEsS0FBQSxDQUFBLE9BQUEsQ0FBQSxTQUFBLE1BQUEsQ0FBQSxDQUFBLEVBQUE7QUFDQSxhQUFBLEdBQUEsQ0FBQSw4QkFBQSxFQUFBLFNBQUEsSUFBQTtBQUNBLG9CQUFBLEdBQUEsRUFBQSxLQUFBLENBQUEsSUFBQSxDQUFBLFNBQUE7QUFDQTtBQUNBO0FBQ0EsVUFBQSxTQUFBLElBQUE7QUFDQSxHQVZBLENBQUE7QUFXQSxFQWJBOztBQWVBLG1CQUFBLGdCQUFBLEdBQUEsVUFBQSxVQUFBLEVBQUEsU0FBQSxFQUFBOztBQUVBLFNBQUEsTUFBQSxNQUFBLENBQUEsa0JBQUEsVUFBQSxHQUFBLFNBQUEsR0FBQSxTQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsUUFBQSxFQUFBOzs7QUFHQSxPQUFBLFVBQUEsRUFBQSxLQUFBLENBQUEsY0FBQSxFQUFBLEtBQUEsQ0FBQSxLQUFBLEVBQUEsT0FBQSxDQUFBLFVBQUEsRUFBQSxLQUFBLEVBQUE7QUFDQSxPQUFBLFdBQUEsRUFBQSxLQUFBLENBQUEsc0JBQUEsRUFBQSxLQUFBLENBQUEsS0FBQSxFQUFBLE9BQUEsQ0FBQSxVQUFBLEVBQUEsS0FBQSxFQUFBOzs7QUFHQSxPQUFBLGNBQUEsZUFBQSxPQUFBLEVBQUEsS0FBQSxDQUFBLE9BQUEsQ0FBQSxTQUFBLENBQUE7QUFDQSxPQUFBLGVBQUEsRUFBQSxLQUFBLENBQUEsdUJBQUEsUUFBQSxFQUFBLEtBQUEsRUFBQSxLQUFBLENBQUEsS0FBQSxFQUFBLE9BQUEsQ0FBQSxTQUFBLEVBQUEsS0FBQSxFQUFBOzs7QUFHQSxrQkFBQSxPQUFBLEVBQUEsS0FBQSxDQUFBLE1BQUEsQ0FBQSxXQUFBLEVBQUEsQ0FBQTtBQUNBLDBCQUFBLFFBQUEsRUFBQSxLQUFBLENBQUEsTUFBQSxDQUFBLFlBQUEsRUFBQSxDQUFBOztBQUdBLFVBQUEsU0FBQSxJQUFBO0FBQ0EsR0FqQkEsQ0FBQTtBQWtCQSxFQXBCQTs7QUFzQkEsbUJBQUEsWUFBQSxHQUFBLFVBQUEsRUFBQSxFQUFBO0FBQ0EsU0FBQSxNQUFBLE1BQUEsQ0FBQSxrQkFBQSxFQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsS0FBQSxNQUFBLENBQUEsY0FBQSxFQUFBLFVBQUEsTUFBQSxFQUFBO0FBQ0EsV0FBQSxPQUFBLEdBQUEsS0FBQSxFQUFBO0FBQ0EsSUFGQTtBQUdBLFVBQUEsU0FBQSxJQUFBO0FBQ0EsR0FOQSxDQUFBO0FBT0EsRUFSQTs7QUFVQSxRQUFBLGlCQUFBO0FBQ0EsQ0FqTEE7O0FDQUEsSUFBQSxPQUFBLENBQUEsaUJBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLEtBQUEsa0JBQUEsRUFBQTtBQUNBLEtBQUEsWUFBQSxFQUFBO0FBQ0EsaUJBQUEsZUFBQSxHQUFBLFVBQUEsRUFBQSxFQUFBO0FBQ0EsU0FBQSxNQUFBLEdBQUEsQ0FBQSx1QkFBQSxFQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsT0FBQSxDQUFBLFVBQUEsRUFBQSxDQUFBLEVBQUE7QUFDQSxjQUFBLEVBQUEsSUFBQSxFQUFBO0FBQ0E7QUFDQSxXQUFBLElBQUEsQ0FBQSxTQUFBLElBQUEsRUFBQSxVQUFBLEVBQUEsQ0FBQTtBQUNBLFVBQUEsVUFBQSxFQUFBLENBQUE7QUFDQSxHQVBBLENBQUE7QUFRQSxFQVRBOztBQVdBLGlCQUFBLGVBQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLFNBQUEsTUFBQSxHQUFBLENBQUEsdUJBQUEsRUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFFBQUEsRUFBQTtBQUNBLFVBQUEsU0FBQSxJQUFBO0FBQ0EsR0FIQSxDQUFBO0FBSUEsRUFMQTs7QUFPQSxpQkFBQSxvQkFBQSxHQUFBLFVBQUEsRUFBQSxFQUFBLElBQUEsRUFBQTtBQUNBLFNBQUEsTUFBQSxJQUFBLENBQUEsd0JBQUEsRUFBQSxFQUFBLEVBQUEsTUFBQSxJQUFBLEVBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxRQUFBLEVBQUE7Ozs7Ozs7O0FBUUEsVUFBQSxTQUFBLElBQUE7QUFDQSxHQVZBLENBQUE7QUFXQSxFQVpBOztBQWNBLGlCQUFBLGFBQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLFNBQUEsTUFBQSxNQUFBLENBQUEsbUJBQUEsRUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFFBQUEsRUFBQTtBQUNBLFVBQUEsU0FBQSxJQUFBO0FBQ0EsR0FIQSxDQUFBO0FBSUEsRUFMQTs7QUFPQSxpQkFBQSxXQUFBLEdBQUEsVUFBQSxFQUFBLEVBQUEsSUFBQSxFQUFBO0FBQ0EsU0FBQSxNQUFBLEdBQUEsQ0FBQSxtQkFBQSxFQUFBLEVBQUEsRUFBQSxNQUFBLElBQUEsRUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFFBQUEsRUFBQTtBQUNBLFVBQUEsU0FBQSxJQUFBO0FBQ0EsR0FIQSxDQUFBO0FBSUEsRUFMQTs7QUFPQSxpQkFBQSxJQUFBLEdBQUEsVUFBQSxFQUFBLEVBQUEsU0FBQSxFQUFBO0FBQ0EsU0FBQSxNQUFBLEdBQUEsQ0FBQSxtQkFBQSxFQUFBLFVBQUEsU0FBQSxVQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsVUFBQSxTQUFBLElBQUE7QUFDQSxHQUhBLENBQUE7QUFJQSxFQUxBOztBQU9BLFFBQUEsZUFBQTtBQUVBLENBMURBOztBQ0FBLElBQUEsVUFBQSxDQUFBLG9CQUFBLEVBQUEsVUFBQSxTQUFBLEVBQUEsZUFBQSxFQUFBLGlCQUFBLEVBQUEsT0FBQSxFQUFBLE9BQUEsRUFBQSxhQUFBLEVBQUE7O0FBRUEsTUFBQSxPQUFBLEdBQUEsT0FBQTtBQUNBLE1BQUEsYUFBQSxHQUFBLGFBQUE7O0FBRUEsTUFBQSxLQUFBLEdBQUEsWUFBQTtBQUNBLFlBQUEsTUFBQTtBQUNBLEVBRkE7QUFHQSxNQUFBLE1BQUEsR0FBQSxVQUFBLElBQUEsRUFBQTs7QUFFQSxVQUFBLEdBQUEsQ0FBQSwwQkFBQSxFQUFBLElBQUE7O0FBRUEsTUFBQSxhQUFBLElBQUE7QUFDQSxNQUFBLEtBQUEsU0FBQSxFQUFBLGFBQUEsS0FBQSxTQUFBLENBQUEsR0FBQTs7QUFFQSxrQkFBQSxRQUFBLENBQUEsS0FBQSxPQUFBLEVBQUEsUUFBQSxJQUFBLENBQUEsR0FBQSxFQUFBLENBQUEsVUFBQSxDQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsYUFBQSxJQUFBOztBQUVBLEdBSkE7QUFLQSxFQVpBO0FBYUEsQ0FyQkE7O0FDQUEsSUFBQSxVQUFBLENBQUEscUJBQUEsRUFBQSxVQUFBLFNBQUEsRUFBQSxpQkFBQSxFQUFBLE9BQUEsRUFBQTs7QUFHQSxNQUFBLEtBQUEsR0FBQSxZQUFBO0FBQ0EsWUFBQSxNQUFBO0FBQ0EsRUFGQTtBQUdBLE1BQUEsTUFBQSxHQUFBLFVBQUEsSUFBQSxFQUFBOzs7O0FBSUEsTUFBQSxDQUFBLENBQUEsS0FBQSxNQUFBLEVBQUE7QUFDQSxxQkFBQSxxQkFBQSxDQUFBLEtBQUEsSUFBQSxFQUNBLElBREEsQ0FDQSxVQUFBLFFBQUEsRUFBQTtBQUNBLFlBQUEsR0FBQSxDQUFBLHNDQUFBLEVBQUEsUUFBQTtBQUNBLGNBQUEsSUFBQTtBQUNBLElBSkE7QUFLQSxHQU5BLE1BTUE7QUFDQSxxQkFBQSxlQUFBLENBQUEsS0FBQSxJQUFBLEVBQ0EsSUFEQSxDQUNBLFVBQUEsUUFBQSxFQUFBO0FBQ0EsWUFBQSxHQUFBLENBQUEsZ0NBQUEsRUFBQSxRQUFBO0FBQ0EsY0FBQSxJQUFBO0FBQ0EsSUFKQTtBQUtBO0FBRUEsRUFsQkE7QUFvQkEsQ0ExQkE7QUNBQSxJQUFBLFVBQUEsQ0FBQSxxQkFBQSxFQUFBLFVBQUEsU0FBQSxFQUFBLGlCQUFBLEVBQUEsT0FBQSxFQUFBLGFBQUEsRUFBQTs7QUFFQSxNQUFBLE9BQUEsR0FBQSxPQUFBO0FBQ0EsTUFBQSxhQUFBLEdBQUEsYUFBQTs7QUFFQSxNQUFBLEtBQUEsR0FBQSxZQUFBO0FBQ0EsWUFBQSxNQUFBO0FBQ0EsRUFGQTs7QUFJQSxNQUFBLE1BQUEsR0FBQSxVQUFBLFNBQUEsRUFBQSxZQUFBLEVBQUE7Ozs7QUFJQSxNQUFBLGFBQUEsSUFBQSxLQUFBLFFBQUEsRUFBQTtBQUNBLHFCQUFBLGlCQUFBLENBQUEsYUFBQSxHQUFBLEVBQUEsU0FBQSxFQUNBLElBREEsQ0FDQSxZQUFBO0FBQ0EsY0FBQSxJQUFBO0FBQ0EsSUFIQTtBQUlBLEdBTEEsTUFLQTtBQUNBLHFCQUFBLFdBQUEsQ0FBQSxhQUFBLEdBQUEsRUFBQSxTQUFBLEVBQ0EsSUFEQSxDQUNBLFlBQUE7QUFDQSxjQUFBLElBQUE7QUFDQSxJQUhBO0FBSUE7QUFFQSxFQWhCQTtBQWlCQSxDQTFCQTs7QUNBQSxJQUFBLFNBQUEsQ0FBQSxlQUFBLEVBQUEsWUFBQTtBQUNBLFFBQUE7QUFDQSxZQUFBLEdBREE7QUFFQSxTQUFBO0FBQ0EsWUFBQSxHQURBO0FBRUEsMkJBQUE7QUFGQSxHQUZBO0FBTUEsZUFBQSxxREFOQTtBQU9BLGNBQUE7QUFQQSxFQUFBO0FBU0EsQ0FWQTs7QUFZQSxJQUFBLFVBQUEsQ0FBQSxtQkFBQSxFQUFBLFVBQUEsTUFBQSxFQUFBLGVBQUEsRUFBQTs7QUFFQSxRQUFBLGVBQUEsR0FBQSxVQUFBLE9BQUEsRUFBQTtBQUNBLE1BQUEsUUFBQSxLQUFBLEVBQUE7QUFDQSxXQUFBLEtBQUEsR0FBQSxLQUFBO0FBQ0EsbUJBQUEsaUJBQUEsQ0FBQSxRQUFBLEdBQUEsRUFDQSxJQURBLENBQ0EsVUFBQSxJQUFBLEVBQUE7QUFDQSxZQUFBLEdBQUEsQ0FBQSxJQUFBO0FBQ0EsSUFIQTtBQUlBLEdBTkEsTUFNQTtBQUNBLFdBQUEsS0FBQSxHQUFBLElBQUE7QUFDQSxtQkFBQSxlQUFBLENBQUEsT0FBQSxFQUNBLElBREEsQ0FDQSxVQUFBLElBQUEsRUFBQTtBQUNBLFlBQUEsR0FBQSxDQUFBLElBQUE7QUFDQSxJQUhBO0FBSUE7QUFDQSxFQWRBOztBQWdCQSxLQUFBLENBQUEsQ0FBQSxPQUFBLHNCQUFBLEVBQUE7QUFDQSxNQUFBLGNBQUEsT0FBQSxzQkFBQSxFQUFBOztBQUVBLFNBQUEsa0JBQUEsR0FBQSxVQUFBLE1BQUEsRUFBQTtBQUNBLGVBQUEsTUFBQTtBQUNBLEdBRkE7QUFHQTtBQUVBLENBMUJBOztBQ1pBLElBQUEsU0FBQSxDQUFBLGtCQUFBLEVBQUEsQ0FBQSxVQUFBLEVBQUEsVUFBQSxRQUFBLEVBQUE7QUFDQSxRQUFBO0FBQ0EsWUFBQSxhQURBO0FBRUEsU0FBQTtBQUNBLFlBQUE7QUFEQSxHQUZBO0FBS0EsUUFBQSxjQUFBLEtBQUEsRUFBQSxJQUFBLEVBQUE7QUFDQSxPQUFBLE9BQUEsRUFBQTtBQUNBLFNBQUEsTUFBQSxDQUFBLFNBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQTtBQUNBLFFBQUEsQ0FBQSxLQUFBLEVBQUE7QUFDQSxRQUFBLFVBQUEsU0FBQSxLQUFBLEVBQUEsTUFBQSxPQUFBLENBQUE7QUFDQSxTQUFBLFFBQUEsR0FBQSxNQUFBO0FBQ0EsWUFBQSxJQUFBLENBQUEsS0FBQSxFQUFBLFFBQUEsQ0FBQSxnQkFBQTtBQUNBLFNBQUEsTUFBQSxDQUFBLE9BQUE7QUFDQSxJQU5BO0FBT0E7QUFkQSxFQUFBO0FBZ0JBLENBakJBLENBQUE7O0FDQUEsSUFBQSxTQUFBLENBQUEsZUFBQSxFQUFBLFlBQUE7QUFDQSxRQUFBO0FBQ0EsWUFBQSxHQURBO0FBRUEsZUFBQTtBQUZBLEVBQUE7QUFJQSxDQUxBO0FDQUEsSUFBQSxTQUFBLENBQUEsUUFBQSxFQUFBLFVBQUEsVUFBQSxFQUFBLFdBQUEsRUFBQSxXQUFBLEVBQUEsTUFBQSxFQUFBLFVBQUEsRUFBQSxZQUFBLEVBQUE7O0FBRUEsUUFBQTtBQUNBLFlBQUEsR0FEQTtBQUVBLFNBQUEsRUFGQTtBQUdBLGVBQUEsMENBSEE7QUFJQSxRQUFBLGNBQUEsS0FBQSxFQUFBLE9BQUEsRUFBQTs7QUFFQSxTQUFBLE1BQUEsR0FBQSxZQUFBO0FBQ0EsZUFBQSxNQUFBLEVBQUEsTUFBQTtBQUNBLElBRkE7O0FBSUEsU0FBQSxLQUFBLEdBQUEsQ0FDQSxFQUFBLE9BQUEsTUFBQSxFQUFBLE9BQUEsTUFBQSxFQURBLEVBRUEsRUFBQSxPQUFBLFFBQUEsRUFBQSxPQUFBLFFBQUEsRUFGQSxFQUdBLEVBQUEsT0FBQSxPQUFBLEVBQUEsT0FBQSxPQUFBLEVBSEEsRUFJQSxFQUFBLE9BQUEsY0FBQSxFQUFBLE9BQUEsYUFBQSxFQUFBLE1BQUEsSUFBQSxFQUpBLENBQUE7O0FBT0EsU0FBQSxJQUFBLEdBQUEsSUFBQTs7QUFFQSxTQUFBLFVBQUEsR0FBQSxZQUFBO0FBQ0EsV0FBQSxZQUFBLGVBQUEsRUFBQTtBQUNBLElBRkE7O0FBSUEsU0FBQSxNQUFBLEdBQUEsWUFBQTtBQUNBLGdCQUFBLE1BQUEsR0FBQSxJQUFBLENBQUEsWUFBQTtBQUNBLFlBQUEsRUFBQSxDQUFBLE9BQUE7QUFDQSxnQkFBQSxZQUFBLEdBQUEsSUFBQTtBQUNBLEtBSEE7QUFJQSxJQUxBOztBQU9BLFNBQUEsT0FBQSxHQUFBLFlBQUE7QUFDQSxZQUFBLEdBQUEsQ0FBQSx3QkFBQTtBQUNBLFdBQUEsTUFBQTtBQUNBLElBSEE7O0FBS0EsT0FBQSxVQUFBLFNBQUEsT0FBQSxHQUFBO0FBQ0EsZ0JBQUEsZUFBQSxHQUFBLElBQUEsQ0FBQSxVQUFBLElBQUEsRUFBQTtBQUNBLFdBQUEsSUFBQSxHQUFBLElBQUE7QUFDQSxLQUZBO0FBR0EsSUFKQTs7QUFNQSxPQUFBLGFBQUEsU0FBQSxVQUFBLEdBQUE7QUFDQSxVQUFBLElBQUEsR0FBQSxJQUFBO0FBQ0EsSUFGQTs7QUFJQTs7QUFFQSxjQUFBLEdBQUEsQ0FBQSxZQUFBLFlBQUEsRUFBQSxPQUFBO0FBQ0EsY0FBQSxHQUFBLENBQUEsWUFBQSxhQUFBLEVBQUEsVUFBQTtBQUNBLGNBQUEsR0FBQSxDQUFBLFlBQUEsY0FBQSxFQUFBLFVBQUE7QUFFQTs7QUFuREEsRUFBQTtBQXVEQSxDQXpEQTs7QUNBQSxJQUFBLFNBQUEsQ0FBQSxlQUFBLEVBQUEsVUFBQSxlQUFBLEVBQUE7O0FBRUEsUUFBQTtBQUNBLFlBQUEsR0FEQTtBQUVBLGVBQUEsMERBRkE7QUFHQSxRQUFBLGNBQUEsS0FBQSxFQUFBO0FBQ0EsU0FBQSxRQUFBLEdBQUEsZ0JBQUEsaUJBQUEsRUFBQTtBQUNBO0FBTEEsRUFBQTtBQVFBLENBVkE7QUNBQSxJQUFBLFNBQUEsQ0FBQSxjQUFBLEVBQUEsVUFBQSxpQkFBQSxFQUFBO0FBQ0EsUUFBQTtBQUNBLFlBQUEsR0FEQTtBQUVBLFNBQUEsRUFBQSxZQUFBLEdBQUEsRUFBQSxvQkFBQSxJQUFBLEVBRkE7QUFHQSxlQUFBLG1EQUhBOztBQUtBLFFBQUEsY0FBQSxLQUFBLEVBQUE7QUFDQSxTQUFBLE1BQUEsR0FBQSxVQUFBLFFBQUEsRUFBQTtBQUNBLGVBQUEsU0FBQSxXQUFBLEVBQUE7QUFDQSxRQUFBLFdBQUEsTUFBQSxRQUFBLEdBQUEsVUFBQTtBQUNBLFFBQUEsU0FBQSxNQUFBLFFBQUE7QUFDQSxRQUFBLEVBQUEsUUFBQSxFQUFBLEdBQUEsQ0FBQSxXQUFBLE1BQUEsTUFBQSxFQUFBO0FBQ0EsT0FBQSxRQUFBLEVBQUEsR0FBQSxDQUFBLFdBQUEsRUFBQSxFQUFBO0FBQ0EsT0FBQSxNQUFBLEVBQUEsSUFBQSxDQUFBLEdBQUE7QUFDQSxLQUhBLE1BSUE7QUFDQSxPQUFBLFFBQUEsRUFBQSxHQUFBLENBQUEsV0FBQSxFQUFBLGdCQUFBO0FBQ0EsT0FBQSxNQUFBLEVBQUEsSUFBQSxDQUFBLEdBQUE7QUFDQTtBQUNBLElBWkE7O0FBY0EsT0FBQSxDQUFBLENBQUEsTUFBQSxrQkFBQSxFQUFBO0FBQ0EsVUFBQSxJQUFBLEdBQUEsSUFBQTtBQUNBLFVBQUEscUJBQUEsR0FBQSxVQUFBLFVBQUEsRUFBQTs7QUFFQSxZQUFBLFNBQUEscUJBQUEsQ0FBQSxNQUFBLEVBQUE7O0FBRUEsYUFBQSxNQUFBLGtCQUFBLENBQUEsRUFBQSxZQUFBLFVBQUEsRUFBQSxRQUFBLE1BQUEsRUFBQSxDQUFBO0FBQ0EsTUFIQTtBQUlBLEtBTkE7QUFPQSxJQVRBLE1BU0E7QUFDQSxVQUFBLElBQUEsR0FBQSxLQUFBO0FBQ0E7QUFFQTtBQWpDQSxFQUFBO0FBbUNBLENBcENBOztBQ0FBLElBQUEsU0FBQSxDQUFBLFNBQUEsRUFBQSxVQUFBLGlCQUFBLEVBQUE7QUFDQSxRQUFBO0FBQ0EsWUFBQSxHQURBO0FBRUEsU0FBQSxFQUZBO0FBR0EsZUFBQSw0Q0FIQTs7QUFLQSxRQUFBLGNBQUEsS0FBQSxFQUFBOztBQUVBLHFCQUFBLGNBQUEsR0FDQSxJQURBLENBQ0EsVUFBQSxPQUFBLEVBQUE7QUFDQSxVQUFBLE9BQUEsR0FBQSxPQUFBO0FBQ0EsSUFIQTs7QUFLQSxxQkFBQSxvQkFBQSxHQUNBLElBREEsQ0FDQSxVQUFBLGFBQUEsRUFBQTtBQUNBLFVBQUEsYUFBQSxHQUFBLGFBQUE7QUFDQSxJQUhBOztBQUtBLFNBQUEsWUFBQSxHQUFBLFVBQUEsRUFBQSxFQUFBO0FBQ0Esc0JBQUEsWUFBQSxDQUFBLEVBQUEsRUFDQSxJQURBLENBQ0EsWUFBQTtBQUNBLFNBQUEsUUFBQSxNQUFBLE9BQUEsQ0FBQSxHQUFBLENBQUEsVUFBQSxPQUFBLEVBQUE7QUFDQSxhQUFBLFFBQUEsR0FBQTtBQUNBLE1BRkEsRUFFQSxPQUZBLENBRUEsRUFGQSxDQUFBOztBQUlBLFdBQUEsT0FBQSxDQUFBLE1BQUEsQ0FBQSxLQUFBLEVBQUEsQ0FBQTtBQUNBLEtBUEE7QUFRQSxJQVRBOztBQVdBLFNBQUEsa0JBQUEsR0FBQSxVQUFBLEVBQUEsRUFBQTtBQUNBLHNCQUFBLGtCQUFBLENBQUEsRUFBQSxFQUNBLElBREEsQ0FDQSxZQUFBO0FBQ0EsU0FBQSxRQUFBLE1BQUEsYUFBQSxDQUFBLEdBQUEsQ0FBQSxVQUFBLE9BQUEsRUFBQTtBQUNBLGFBQUEsUUFBQSxHQUFBO0FBQ0EsTUFGQSxFQUVBLE9BRkEsQ0FFQSxFQUZBLENBQUE7O0FBSUEsV0FBQSxhQUFBLENBQUEsTUFBQSxDQUFBLEtBQUEsRUFBQSxDQUFBO0FBQ0EsS0FQQTtBQVFBLElBVEE7O0FBV0EsS0FBQSxVQUFBLEVBQUEsS0FBQSxDQUFBLFlBQUE7QUFDQSxRQUFBLEVBQUEsSUFBQSxFQUFBLEdBQUEsQ0FBQSxXQUFBLE1BQUEsTUFBQSxFQUFBO0FBQ0EsT0FBQSxJQUFBLEVBQUEsR0FBQSxDQUFBLFdBQUEsRUFBQSxFQUFBO0FBQ0EsU0FBQSxFQUFBLElBQUEsRUFBQSxJQUFBLENBQUEsSUFBQSxNQUFBLG9CQUFBLEVBQ0EsRUFBQSxnQkFBQSxFQUFBLElBQUEsQ0FBQSxHQUFBO0FBQ0EsU0FBQSxFQUFBLElBQUEsRUFBQSxJQUFBLENBQUEsSUFBQSxNQUFBLGNBQUEsRUFDQSxFQUFBLFVBQUEsRUFBQSxJQUFBLENBQUEsR0FBQTtBQUNBLEtBTkEsTUFPQTtBQUNBLE9BQUEsSUFBQSxFQUFBLEdBQUEsQ0FBQSxXQUFBLEVBQUEsZ0JBQUE7QUFDQSxTQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsQ0FBQSxJQUFBLE1BQUEsb0JBQUEsRUFDQSxFQUFBLGdCQUFBLEVBQUEsSUFBQSxDQUFBLEdBQUE7QUFDQSxTQUFBLEVBQUEsSUFBQSxFQUFBLElBQUEsQ0FBQSxJQUFBLE1BQUEsY0FBQSxFQUNBLEVBQUEsVUFBQSxFQUFBLElBQUEsQ0FBQSxHQUFBO0FBQ0E7QUFDQSxJQWZBO0FBaUJBO0FBeERBLEVBQUE7QUEwREEsQ0EzREE7O0FDQUEsSUFBQSxTQUFBLENBQUEsV0FBQSxFQUFBLFVBQUEsU0FBQSxFQUFBLE1BQUEsRUFBQSxVQUFBLEVBQUEsaUJBQUEsRUFBQSxlQUFBLEVBQUE7QUFDQSxRQUFBO0FBQ0EsWUFBQSxHQURBO0FBRUEsU0FBQSxFQUZBO0FBR0EsZUFBQSxtREFIQTtBQUlBLFFBQUEsY0FBQSxLQUFBLEVBQUEsT0FBQSxFQUFBLFNBQUEsRUFBQTs7QUFFQSxTQUFBLEtBQUEsQ0FBQSxHQUFBLENBQUEscUJBQUEsRUFBQSxVQUFBLEtBQUEsRUFBQSxPQUFBLEVBQUEsUUFBQSxFQUFBLFNBQUEsRUFBQSxVQUFBLEVBQUE7QUFDQSxRQUFBLGlCQUFBO0FBQ0EsY0FBQTtBQUNBLGNBQUEsS0FEQTtBQUVBLGFBQUEsQ0FGQTtBQUdBLGNBQUEsS0FIQTtBQUlBLGFBQUEsS0FKQTtBQUtBLGFBQUEsQ0FDQTtBQUNBLGFBQUEsU0FEQTtBQUVBLGFBQUEscUNBRkE7QUFHQSxrQkFBQSxLQUhBO0FBSUEsZUFBQSxZQUpBO0FBS0EsbUJBQUEsb0JBTEE7QUFNQSxxQkFBQSxRQU5BO0FBT0Esb0JBQUEsd0RBUEE7QUFRQSxnQkFBQTtBQUNBLGlCQUFBLG1CQUFBO0FBQ0EsZ0JBQUEsa0JBQUEsY0FBQSxFQUFBO0FBQ0EsU0FIQTtBQUlBLHVCQUFBLHlCQUFBO0FBQ0EsZ0JBQUEsa0JBQUEsb0JBQUEsRUFBQTtBQUNBO0FBTkE7QUFSQSxPQURBLEVBa0JBO0FBQ0EsYUFBQSwyQkFEQTtBQUVBLGFBQUEsOENBRkE7QUFHQSxrQkFBQSxRQUhBO0FBSUEsZUFBQSxZQUpBO0FBS0EsbUJBQUEscUJBTEE7QUFNQSxxQkFBQSxRQU5BO0FBT0Esb0JBQUE7QUFQQSxPQWxCQSxDQUxBO0FBaUNBLGtCQUFBLG9CQUFBLE1BQUEsRUFBQSxJQUFBLEVBQUE7QUFDQSxXQUFBLE1BQUEsRUFBQSxJQUFBLEVBQUEsSUFBQTtBQUNBO0FBbkNBLE1BREE7O0FBdUNBLGNBQUE7QUFDQSxjQUFBLEtBREE7QUFFQSxhQUFBLENBRkE7QUFHQSxjQUFBLEtBSEE7QUFJQSxhQUFBLEtBSkE7QUFLQSxhQUFBLENBQ0E7QUFDQSxhQUFBLG9CQURBO0FBRUEsYUFBQSxnQ0FGQTtBQUdBLGtCQUFBLEtBSEE7QUFJQSxlQUFBLFVBSkE7QUFLQSxhQUFBLGNBTEE7QUFNQSxhQUFBLEVBQUEsSUFBQSxTQUFBLEVBQUE7QUFOQSxPQURBLEVBU0E7QUFDQSxhQUFBLG9CQURBO0FBRUEsYUFBQSwwQ0FGQTtBQUdBLGtCQUFBLFFBSEE7QUFJQSxlQUFBLGFBSkE7QUFLQSxhQUFBLEVBQUEsSUFBQSxTQUFBLEVBQUE7QUFMQSxPQVRBLEVBZ0JBO0FBQ0EsYUFBQSw4QkFEQTtBQUVBLGFBQUEsOENBRkE7QUFHQSxrQkFBQSxLQUhBO0FBSUEsZUFBQSxZQUpBO0FBS0EsbUJBQUEscUJBTEE7QUFNQSxxQkFBQSxRQU5BO0FBT0Esb0JBQUEsc0RBUEE7QUFRQSxnQkFBQTtBQUNBLGlCQUFBLG1CQUFBO0FBQ0EsZ0JBQUEsa0JBQUEsY0FBQSxFQUFBO0FBQ0EsU0FIQTtBQUlBLHVCQUFBLHlCQUFBO0FBQ0EsZ0JBQUEsa0JBQUEsb0JBQUEsRUFBQTtBQUNBO0FBTkEsUUFSQTtBQWdCQSxhQUFBLEVBQUEsSUFBQSxTQUFBLEVBQUE7QUFoQkEsT0FoQkEsQ0FMQTtBQXlDQSxrQkFBQSxvQkFBQSxNQUFBLEVBQUEsSUFBQSxFQUFBO0FBQ0EsV0FBQSxNQUFBLEVBQUEsSUFBQSxFQUFBLElBQUE7QUFDQTtBQTNDQTtBQXZDQSxLQUFBLEM7O0FBc0ZBLFFBQUEsZUFBQSxRQUFBLElBQUEsQ0FBQSxFQUFBO0FBQ0EsVUFBQSxJQUFBLEdBQUEsSUFBQSxlQUFBLFFBQUEsSUFBQSxDQUFBLEVBQUE7QUFDQSxZQUFBLEdBQUEsSUFBQSxlQUFBLFFBQUEsSUFBQSxFQUFBLEdBQUEsQ0FBQTtBQUNBO0FBQ0EsS0FKQSxNQUlBO0FBQ0EsVUFBQSxJQUFBLEdBQUEsSUFBQSxlQUFBLFNBQUEsQ0FBQSxFQUFBO0FBQ0EsWUFBQSxHQUFBLElBQUEsZUFBQSxTQUFBLEVBQUEsR0FBQSxDQUFBO0FBQ0E7QUFDQTtBQUVBLElBakdBLEU7OztBQW9HQSxZQUFBLEdBQUEsQ0FBQSxNQUFBLEVBQUEsSUFBQSxFQUFBLE9BQUEsRUFBQTtBQUNBLFFBQUEsS0FBQSxNQUFBLEtBQUEsWUFBQSxFQUFBO0FBQ0EsZUFBQSxJQUFBLENBQUE7QUFDQSxhQUFBLE9BREE7QUFFQSxxQkFBQSxJQUZBO0FBR0EsMkJBQUEsSUFIQTtBQUlBLGtCQUFBLEtBQUEsVUFKQTtBQUtBLG9CQUFBLEtBQUEsWUFMQTtBQU1BLG1CQUFBLEtBQUEsV0FOQTtBQU9BLG1CQUFBLE1BUEE7QUFRQSxjQUFBO0FBQ0EsYUFBQTtBQURBLE9BUkE7QUFXQSxlQUFBLEtBQUE7O0FBWEEsTUFBQTtBQWNBOztBQUVBLFFBQUEsS0FBQSxNQUFBLEtBQUEsVUFBQSxFQUFBO0FBQ0EsWUFBQSxFQUFBLENBQUEsS0FBQSxJQUFBLEVBQUEsS0FBQSxJQUFBO0FBQ0E7O0FBRUEsUUFBQSxLQUFBLE1BQUEsS0FBQSxhQUFBLEVBQUE7QUFDQSxxQkFBQSxlQUFBLENBQUEsS0FBQSxJQUFBLENBQUEsRUFBQTtBQUNBO0FBQ0E7QUFFQSxHO0FBcklBLEVBQUE7QUF1SUEsQ0F4SUEiLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcclxuXHJcbmZ1bmN0aW9uIGNhY2hlRGVsZXRlKCkge1xyXG4gIGNvbnNvbGUubG9nKCdEZWxldGluZyBjYWNoZS4uLicpO1xyXG4gIGNhY2hlcy5rZXlzKCkudGhlbihmdW5jdGlvbiAoa2V5cykge1xyXG4gIFx0a2V5cy5mb3JFYWNoKGZ1bmN0aW9uIChrZXkpIHtcclxuICBcdFx0Y2FjaGVzLmRlbGV0ZShrZXkpXHJcbiAgXHR9KVxyXG4gIH0pXHJcbn1cclxuXHJcbndpbmRvdy5hcHAgPSBhbmd1bGFyLm1vZHVsZSgnRnVsbHN0YWNrR2VuZXJhdGVkQXBwJywgWydmc2FQcmVCdWlsdCcsICd1aS5yb3V0ZXInLCAndWkuYm9vdHN0cmFwJywgJ25nQW5pbWF0ZScsICduZ01hdGVyaWFsJywgJ25nTWVzc2FnZXMnXSk7XHJcblxyXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkdXJsUm91dGVyUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkbWRUaGVtaW5nUHJvdmlkZXIpIHtcclxuICAgIC8vIFRoaXMgdHVybnMgb2ZmIGhhc2hiYW5nIHVybHMgKC8jYWJvdXQpIGFuZCBjaGFuZ2VzIGl0IHRvIHNvbWV0aGluZyBub3JtYWwgKC9hYm91dClcclxuICAgICRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcclxuICAgIC8vIElmIHdlIGdvIHRvIGEgVVJMIHRoYXQgdWktcm91dGVyIGRvZXNuJ3QgaGF2ZSByZWdpc3RlcmVkLCBnbyB0byB0aGUgXCIvXCIgdXJsLlxyXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnLycpO1xyXG4gICAgLy8gVHJpZ2dlciBwYWdlIHJlZnJlc2ggd2hlbiBhY2Nlc3NpbmcgYW4gT0F1dGggcm91dGVcclxuICAgICR1cmxSb3V0ZXJQcm92aWRlci53aGVuKCcvYXV0aC86cHJvdmlkZXInLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLnJlbG9hZCgpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgJG1kVGhlbWluZ1Byb3ZpZGVyLnRoZW1lKCdkZWZhdWx0JylcclxuICAgICAgICAucHJpbWFyeVBhbGV0dGUoJ2JsdWUtZ3JleScpXHJcbiAgICAgICAgLmFjY2VudFBhbGV0dGUoJ2JsdWUtZ3JleScpO1xyXG5cclxufSk7XHJcblxyXG4vLyBUaGlzIGFwcC5ydW4gaXMgZm9yIGNvbnRyb2xsaW5nIGFjY2VzcyB0byBzcGVjaWZpYyBzdGF0ZXMuXHJcbmFwcC5ydW4oZnVuY3Rpb24gKCRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcclxuXHJcbiAgICAvLyBUaGUgZ2l2ZW4gc3RhdGUgcmVxdWlyZXMgYW4gYXV0aGVudGljYXRlZCB1c2VyLlxyXG4gICAgdmFyIGRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGggPSBmdW5jdGlvbiAoc3RhdGUpIHtcclxuICAgICAgICByZXR1cm4gc3RhdGUuZGF0YSAmJiBzdGF0ZS5kYXRhLmF1dGhlbnRpY2F0ZTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gJHN0YXRlQ2hhbmdlU3RhcnQgaXMgYW4gZXZlbnQgZmlyZWRcclxuICAgIC8vIHdoZW5ldmVyIHRoZSBwcm9jZXNzIG9mIGNoYW5naW5nIGEgc3RhdGUgYmVnaW5zLlxyXG5cclxuICAgIEF1dGhTZXJ2aWNlLmdldExvZ2dlZEluVXNlcigpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24obG9nZ2VkSW5Vc2VyKXtcclxuICAgICAgICAgICAgJHJvb3RTY29wZS5sb2dnZWRJblVzZXIgPSBsb2dnZWRJblVzZXI7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgJHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN0YXJ0JywgZnVuY3Rpb24gKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcykge1xyXG5cclxuICAgICAgICBpZiAoIWRlc3RpbmF0aW9uU3RhdGVSZXF1aXJlc0F1dGgodG9TdGF0ZSkpIHtcclxuICAgICAgICAgICAgLy8gVGhlIGRlc3RpbmF0aW9uIHN0YXRlIGRvZXMgbm90IHJlcXVpcmUgYXV0aGVudGljYXRpb25cclxuICAgICAgICAgICAgLy8gU2hvcnQgY2lyY3VpdCB3aXRoIHJldHVybi5cclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKEF1dGhTZXJ2aWNlLmlzQXV0aGVudGljYXRlZCgpKSB7XHJcbiAgICAgICAgICAgIC8vIFRoZSB1c2VyIGlzIGF1dGhlbnRpY2F0ZWQuXHJcbiAgICAgICAgICAgIC8vIFNob3J0IGNpcmN1aXQgd2l0aCByZXR1cm4uXHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENhbmNlbCBuYXZpZ2F0aW5nIHRvIG5ldyBzdGF0ZS5cclxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xyXG5cclxuICAgICAgICBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKS50aGVuKGZ1bmN0aW9uICh1c2VyKSB7XHJcbiAgICAgICAgICAgIC8vIElmIGEgdXNlciBpcyByZXRyaWV2ZWQsIHRoZW4gcmVuYXZpZ2F0ZSB0byB0aGUgZGVzdGluYXRpb25cclxuICAgICAgICAgICAgLy8gKHRoZSBzZWNvbmQgdGltZSwgQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCkgd2lsbCB3b3JrKVxyXG4gICAgICAgICAgICAvLyBvdGhlcndpc2UsIGlmIG5vIHVzZXIgaXMgbG9nZ2VkIGluLCBnbyB0byBcImxvZ2luXCIgc3RhdGUuICAgICAgICAgIFxyXG4gICAgICAgICAgICBpZiAodXNlcikge1xyXG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKHRvU3RhdGUubmFtZSwgdG9QYXJhbXMpO1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdsb2dpbicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgfSk7XHJcblxyXG59KTtcclxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcclxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhcnRpY2xlcycsIHtcclxuICAgICAgICB1cmw6ICcvYXJ0aWNsZXMnLFxyXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2FydGljbGVzL2FydGljbGVzLmh0bWwnLFxyXG4gICAgICAgIHJlc29sdmU6IHtcclxuICAgICAgICAgICAgYXJ0aWNsZXM6IGZ1bmN0aW9uKEFydGljbGVzRmFjdG9yeSl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gQXJ0aWNsZXNGYWN0b3J5LmZldGNoQWxsKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGNvbnRyb2xsZXI6ICdBcnRpY2xlc0N0cmwnXHJcbiAgICB9KTtcclxufSk7XHJcblxyXG5hcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xyXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FydGljbGUnLCB7XHJcbiAgICAgICAgdXJsOiAnL2FydGljbGVzLzppZCcsXHJcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvYXJ0aWNsZS12aWV3L2FydGljbGUtdmlldy5odG1sJyxcclxuICAgICAgICByZXNvbHZlOiB7XHJcbiAgICAgICAgICBhcnRpY2xlOiBmdW5jdGlvbigkc3RhdGVQYXJhbXMsIEFydGljbGVzRmFjdG9yeSkge1xyXG4gICAgICAgICAgICByZXR1cm4gQXJ0aWNsZXNGYWN0b3J5LmZldGNoQXJ0aWNsZUJ5SWQoJHN0YXRlUGFyYW1zLmlkKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGNvbnRyb2xsZXI6ICdBcnRpY2xlQ3RybCdcclxuICAgIH0pO1xyXG59KTtcclxuXHJcbmFwcC5jb250cm9sbGVyKCdBcnRpY2xlc0N0cmwnLCBmdW5jdGlvbigkc2NvcGUsIGFydGljbGVzLCBBcnRpY2xlc0ZhY3Rvcnkpe1xyXG4gICAgJHNjb3BlLmFydGljbGVzID0gYXJ0aWNsZXMucGFnZXMgfHwgYXJ0aWNsZXM7XHJcblxyXG4gICAgQXJ0aWNsZXNGYWN0b3J5LmZldGNoVXNlckFydGljbGVzQXJyYXkoKVxyXG4gICAgLnRoZW4oZnVuY3Rpb24oc2F2ZWRBcnRpY2xlcyl7XHJcbiAgICAgICAgc2F2ZWRBcnRpY2xlcy5mb3JFYWNoKGZ1bmN0aW9uKGlkKXtcclxuXHJcbiAgICAgICAgICAgIHZhciBpbmRleCA9ICRzY29wZS5hcnRpY2xlcy5tYXAoZnVuY3Rpb24oYXJ0aWNsZSl7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gYXJ0aWNsZS5faWQgKyBcIlwiO1xyXG4gICAgICAgICAgICB9KS5pbmRleE9mKGlkICsgXCJcIik7XHJcblxyXG4gICAgICAgICAgICBpZihpbmRleCA+PSAwKXtcclxuICAgICAgICAgICAgICAgICRzY29wZS5hcnRpY2xlc1tpbmRleF0ubGlrZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSlcclxuICAgIH0pXHJcbn0pXHJcblxyXG5hcHAuY29udHJvbGxlcignQXJ0aWNsZUN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIGFydGljbGUsICRjb21waWxlKSB7XHJcbiAgICAkc2NvcGUuY3VycmVudCA9IGFydGljbGU7XHJcbiAgICAkc2NvcGUudGl0bGUgPSBhcnRpY2xlLnRpdGxlO1xyXG4gICAgJHNjb3BlLmNvbnRlbnQgPSBhcnRpY2xlLmNvbnRlbnQ7XHJcbn0pO1xyXG4iLCIvL1RvLURvIC0gVXNlciBjb21tZW50cywgaW5kaXZpZHVhbCBjb21tZW50XHJcbmFwcC5jb25maWcoZnVuY3Rpb24gKCRzdGF0ZVByb3ZpZGVyKSB7XHJcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncGFnZUNvbW1lbnRzJywge1xyXG4gICAgICAgIHVybDogJy9jb21tZW50cy9wYWdlLzppZCcsXHJcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvY29tbWVudHMvY29tbWVudHMuaHRtbCcsXHJcbiAgICAgICAgcmVzb2x2ZToge1xyXG4gICAgICAgICAgY29tbWVudHM6IGZ1bmN0aW9uKCRzdGF0ZVBhcmFtcywgQ29tbWVudHNGYWN0b3J5KSB7XHJcbiAgICAgICAgICAgIHJldHVybiBDb21tZW50c0ZhY3RvcnkuZmV0Y2hBbGxGb3JQYWdlKCRzdGF0ZVBhcmFtcy5pZCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfSxcclxuICAgICAgICBjb250cm9sbGVyOiAnQ29tbWVudHNDdHJsJ1xyXG4gICAgfSk7XHJcbn0pO1xyXG5cclxuYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcclxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCd1c2VyQ29tbWVudHMnLCB7XHJcbiAgICAgICAgdXJsOiAnL2NvbW1lbnRzL3VzZXIvOmlkJyxcclxuICAgICAgICB0ZW1wbGF0ZVVybDogJ2FwcC9jb21tZW50cy9jb21tZW50cy5odG1sJyxcclxuICAgICAgICByZXNvbHZlOiB7XHJcbiAgICAgICAgICBjb21tZW50czogZnVuY3Rpb24oJHN0YXRlUGFyYW1zLCBDb21tZW50c0ZhY3RvcnkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIENvbW1lbnRzRmFjdG9yeS5mZXRjaEFsbEZvclVzZXIoJHN0YXRlUGFyYW1zLmlkKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9LFxyXG4gICAgICAgIGNvbnRyb2xsZXI6ICdDb21tZW50c0N0cmwnXHJcbiAgICB9KTtcclxufSk7XHJcblxyXG4vL05lZWQgdG8gZml4IEFuZ3VsYXIgYnVnIGhlcmVcclxuYXBwLmNvbnRyb2xsZXIoJ2VkaXRDb21tZW50Q3RybCcsIGZ1bmN0aW9uKCRtZERpYWxvZywgJHN0YXRlLCAkc2NvcGUsIENvbW1lbnRzRmFjdG9yeSl7XHJcbiAgICB0aGlzLmNsb3NlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICRtZERpYWxvZy5jYW5jZWwoKTtcclxuICAgIH07XHJcblxyXG4gICAgdGhpcy5zdWJtaXQgPSBmdW5jdGlvbiAoaW5kZXgsIGRhdGEpIHtcclxuICAgICAgICB2YXIgY29tbWVudCAgPSAkc2NvcGUuY29tbWVudHMuY29tbWVudHNbaW5kZXhdO1xyXG4gICAgICAgIENvbW1lbnRzRmFjdG9yeS5lZGl0Q29tbWVudChjb21tZW50Ll9pZCwgZGF0YSlcclxuICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XHJcbiAgICAgICAgICAgICRtZERpYWxvZy5oaWRlKCk7XHJcbiAgICAgICAgICAgICRzY29wZS5jb21tZW50cy5jb21tZW50c1tpbmRleF0udGV4dCA9IHJlc3BvbnNlLnRleHQ7XHJcbiAgICAgICAgfSlcclxuXHJcblxyXG4gICAgfVxyXG59KVxyXG5cclxuYXBwLmNvbnRyb2xsZXIoJ0NvbW1lbnRzQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHJvb3RTY29wZSwgJHN0YXRlUGFyYW1zLCAkbWREaWFsb2csIGNvbW1lbnRzLCBDb21tZW50c0ZhY3RvcnksIEF1dGhTZXJ2aWNlKXtcclxuICAgICRzY29wZS5jb21tZW50cyA9IGNvbW1lbnRzO1xyXG4gICAgY29uc29sZS5sb2coXCJzY29wZSBjb21tZW50c1wiLCAkc2NvcGUuY29tbWVudHMpXHJcblxyXG4gICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKClcclxuICAgIC50aGVuKGZ1bmN0aW9uKHVzZXIpe1xyXG4gICAgICAgICRzY29wZS51c2VyID0gdXNlcjtcclxuICAgICAgICBjb25zb2xlLmxvZyhcInVzZXJcIiwgJHNjb3BlLnVzZXIpXHJcbiAgICB9KVxyXG5cclxuICAgICRzY29wZS5zdWJtaXRDb21tZW50ID0gZnVuY3Rpb24oKXtcclxuICAgICAgICBDb21tZW50c0ZhY3RvcnkucG9zdENvbW1lbnRUb0FydGljbGUoJHN0YXRlUGFyYW1zLmlkLCAkc2NvcGUuaW5wdXQpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24oY29tbWVudCl7XHJcbiAgICAgICAgICAgICRzY29wZS5jb21tZW50cy5jb21tZW50cy5wdXNoKGNvbW1lbnQpO1xyXG4gICAgICAgIH0pXHJcbiAgICB9XHJcblxyXG4gICAgJHNjb3BlLnJlbW92ZUNvbW1lbnQgPSBmdW5jdGlvbihpbmRleCwgaWQpe1xyXG4gICAgICAgIENvbW1lbnRzRmFjdG9yeS5yZW1vdmVDb21tZW50KGlkKTtcclxuICAgICAgICAkc2NvcGUuY29tbWVudHMuY29tbWVudHMuc3BsaWNlKGluZGV4LCAxKTtcclxuICAgIH1cclxuXHJcbiAgICAkc2NvcGUuZWRpdENvbW1lbnQgPSBmdW5jdGlvbigpe1xyXG4gICAgICAgICRtZERpYWxvZy5zaG93KHtcclxuICAgICAgICAgICAgc2NvcGU6IHRoaXMsXHJcbiAgICAgICAgICAgIHByZXNlcnZlU2NvcGU6IHRydWUsXHJcbiAgICAgICAgICAgIGNsaWNrT3V0c2lkZVRvQ2xvc2U6IHRydWUsXHJcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdlZGl0Q29tbWVudEN0cmwnLFxyXG4gICAgICAgICAgICBjb250cm9sbGVyQXM6ICdlZGl0JyxcclxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvYXBwL2NvbW1lbnRzL2VkaXQtY29tbWVudC5odG1sJyxcclxuICAgICAgICB9KVxyXG4gICAgfVxyXG5cclxuICAgICRzY29wZS52b3RlID0gZnVuY3Rpb24oaWQsIGRpcmVjdGlvbil7XHJcbiAgICAgICAgQ29tbWVudHNGYWN0b3J5LnZvdGUoaWQsIGRpcmVjdGlvbilcclxuICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XHJcbiAgICAgICAgICAgIHZhciBpbmRleCA9ICRzY29wZS5jb21tZW50cy5jb21tZW50cy5tYXAoZnVuY3Rpb24oZWxlbWVudCl7IHJldHVybiBlbGVtZW50Ll9pZCB9KS5pbmRleE9mKHJlc3BvbnNlLl9pZCk7XHJcbiAgICAgICAgICAgICRzY29wZS5jb21tZW50cy5jb21tZW50c1tpbmRleF0udm90ZUNvdW50ID0gcmVzcG9uc2Uudm90ZUNvdW50O1xyXG4gICAgICAgICAgICAkc2NvcGUuY29tbWVudHMuY29tbWVudHMuc29ydChmdW5jdGlvbihhLGIpe1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIGIudm90ZUNvdW50IC0gYS52b3RlQ291bnQ7XHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSlcclxuICAgIH1cclxuXHJcblxyXG59KTtcclxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlcil7XHJcblx0JHN0YXRlUHJvdmlkZXJcclxuXHRcdC5zdGF0ZSgnZm9sZGVycycsIHtcclxuXHRcdFx0dXJsOiAnL2ZvbGRlcnMnLFxyXG5cdFx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9mb2xkZXJzL2ZvbGRlcnMuaHRtbCcsXHJcblx0XHRcdHJlc29sdmU6IHtcclxuXHRcdFx0XHRjYXRlZ29yaWVzOiBmdW5jdGlvbihDYXRlZ29yaWVzRmFjdG9yeSl7XHJcblx0XHRcdFx0XHRyZXR1cm4gQ2F0ZWdvcmllc0ZhY3RvcnkuZ2V0VXNlckZvbGRlcnNEZXRhaWxlZCgpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSxcclxuXHRcdFx0Y29udHJvbGxlcjogJ0ZvbGRlcnNDdHJsJ1xyXG5cdFx0fSlcclxuXHJcblx0XHQuc3RhdGUoJ2ZvbGRlcnMuc2VjdGlvbicsIHtcclxuXHRcdFx0cGFyZW50OiAnZm9sZGVycycsXHJcblx0XHRcdHVybDogJy86bmFtZScsXHJcblx0XHRcdHRlbXBsYXRlVXJsOiAnYXBwL2ZvbGRlcnMvZm9sZGVycy5odG1sJyxcclxuXHRcdFx0Y29udHJvbGxlcjogJ0ZvbGRlclNlY3Rpb25DdHJsJ1xyXG5cdFx0fSlcclxuXHJcbn0pXHJcblxyXG5hcHAuY29udHJvbGxlcignRm9sZGVyc0N0cmwnLCBmdW5jdGlvbigkc2NvcGUsIGNhdGVnb3JpZXMsIENhdGVnb3JpZXNGYWN0b3J5KSB7XHJcblxyXG5cdCRzY29wZS5jYXRlZ29yaWVzID0gY2F0ZWdvcmllcztcclxuXHJcblx0JHNjb3BlLnJlbW92ZUZyb21Gb2xkZXIgPSBmdW5jdGlvbihjYXRlZ29yeUlkLCBwYWdlSWQpe1xyXG5cdFx0dmFyIGNJZCA9IGNhdGVnb3J5SWQuY2F0ZWdvcnlJZDsgdmFyIHBJZCA9IHBhZ2VJZC5wYWdlSWQ7XHJcblx0XHRjb25zb2xlLmxvZyhcIkZvbGRlcnMgQ29udHJvbCAtIFJlbW92ZSBGcm9tXFxuXCIgKyBcImNhdGVnb3J5SWRcIiwgY0lkLCBcInBhZ2VJZFwiLCBwSWQpXHJcblx0XHRDYXRlZ29yaWVzRmFjdG9yeS5yZW1vdmVGcm9tRm9sZGVyKGNJZCwgcElkKTtcclxuXHR9XHJcblxyXG59KTtcclxuXHJcbmFwcC5jb250cm9sbGVyKCdGb2xkZXJTZWN0aW9uQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlUGFyYW1zLCBjYXRlZ29yaWVzKXtcclxuXHR2YXIgZm9sZGVySW5kZXggPSBjYXRlZ29yaWVzLm1hcChmdW5jdGlvbihlbGVtZW50KXtcclxuXHRcdHJldHVybiBlbGVtZW50LmRlc2NyaXB0aW9uLnRvTG93ZXJDYXNlKCk7XHJcblx0fSkuaW5kZXhPZigkc3RhdGVQYXJhbXMubmFtZS50b0xvd2VyQ2FzZSgpKTtcclxuXHJcblx0JHNjb3BlLmNhdGVnb3JpZXMgPSBbY2F0ZWdvcmllc1tmb2xkZXJJbmRleF1dO1xyXG59KTsiLCIoZnVuY3Rpb24gKCkge1xyXG5cclxuICAgICd1c2Ugc3RyaWN0JztcclxuXHJcbiAgICAvLyBIb3BlIHlvdSBkaWRuJ3QgZm9yZ2V0IEFuZ3VsYXIhIER1aC1kb3kuXHJcbiAgICBpZiAoIXdpbmRvdy5hbmd1bGFyKSB0aHJvdyBuZXcgRXJyb3IoJ0kgY2FuXFwndCBmaW5kIEFuZ3VsYXIhJyk7XHJcblxyXG4gICAgdmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdmc2FQcmVCdWlsdCcsIFtdKTtcclxuXHJcbiAgICBhcHAuZmFjdG9yeSgnU29ja2V0JywgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIGlmICghd2luZG93LmlvKSB0aHJvdyBuZXcgRXJyb3IoJ3NvY2tldC5pbyBub3QgZm91bmQhJyk7XHJcbiAgICAgICAgY29uc29sZS5sb2coJ1NvY2tldCBjb25uZWN0aW5nIGF0OiAnLCB3aW5kb3cubG9jYXRpb24ub3JpZ2luKTtcclxuICAgICAgICByZXR1cm4gd2luZG93LmlvKHdpbmRvdy5sb2NhdGlvbi5vcmlnaW4pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gQVVUSF9FVkVOVFMgaXMgdXNlZCB0aHJvdWdob3V0IG91ciBhcHAgdG9cclxuICAgIC8vIGJyb2FkY2FzdCBhbmQgbGlzdGVuIGZyb20gYW5kIHRvIHRoZSAkcm9vdFNjb3BlXHJcbiAgICAvLyBmb3IgaW1wb3J0YW50IGV2ZW50cyBhYm91dCBhdXRoZW50aWNhdGlvbiBmbG93LlxyXG4gICAgYXBwLmNvbnN0YW50KCdBVVRIX0VWRU5UUycsIHtcclxuICAgICAgICBsb2dpblN1Y2Nlc3M6ICdhdXRoLWxvZ2luLXN1Y2Nlc3MnLFxyXG4gICAgICAgIGxvZ2luRmFpbGVkOiAnYXV0aC1sb2dpbi1mYWlsZWQnLFxyXG4gICAgICAgIGxvZ291dFN1Y2Nlc3M6ICdhdXRoLWxvZ291dC1zdWNjZXNzJyxcclxuICAgICAgICBzZXNzaW9uVGltZW91dDogJ2F1dGgtc2Vzc2lvbi10aW1lb3V0JyxcclxuICAgICAgICBub3RBdXRoZW50aWNhdGVkOiAnYXV0aC1ub3QtYXV0aGVudGljYXRlZCcsXHJcbiAgICAgICAgbm90QXV0aG9yaXplZDogJ2F1dGgtbm90LWF1dGhvcml6ZWQnXHJcbiAgICB9KTtcclxuXHJcbiAgICBhcHAuZmFjdG9yeSgnQXV0aEludGVyY2VwdG9yJywgZnVuY3Rpb24gKCRyb290U2NvcGUsICRxLCBBVVRIX0VWRU5UUykge1xyXG4gICAgICAgIHZhciBzdGF0dXNEaWN0ID0ge1xyXG4gICAgICAgICAgICA0MDE6IEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsXHJcbiAgICAgICAgICAgIDQwMzogQVVUSF9FVkVOVFMubm90QXV0aG9yaXplZCxcclxuICAgICAgICAgICAgNDE5OiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dCxcclxuICAgICAgICAgICAgNDQwOiBBVVRIX0VWRU5UUy5zZXNzaW9uVGltZW91dFxyXG4gICAgICAgIH07XHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3Qoc3RhdHVzRGljdFtyZXNwb25zZS5zdGF0dXNdLCByZXNwb25zZSk7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH0pO1xyXG5cclxuICAgIGFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcclxuICAgICAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKFtcclxuICAgICAgICAgICAgJyRpbmplY3RvcicsXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uICgkaW5qZWN0b3IpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAkaW5qZWN0b3IuZ2V0KCdBdXRoSW50ZXJjZXB0b3InKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF0pO1xyXG4gICAgfSk7XHJcblxyXG4gICAgYXBwLnNlcnZpY2UoJ0F1dGhTZXJ2aWNlJywgZnVuY3Rpb24gKCRodHRwLCBTZXNzaW9uLCAkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUywgJHEpIHtcclxuXHJcbiAgICAgICAgZnVuY3Rpb24gb25TdWNjZXNzZnVsTG9naW4ocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgdmFyIGRhdGEgPSByZXNwb25zZS5kYXRhO1xyXG4gICAgICAgICAgICBTZXNzaW9uLmNyZWF0ZShkYXRhLmlkLCBkYXRhLnVzZXIpO1xyXG4gICAgICAgICAgICAkcm9vdFNjb3BlLiRicm9hZGNhc3QoQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzKTtcclxuICAgICAgICAgICAgcmV0dXJuIGRhdGEudXNlcjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFVzZXMgdGhlIHNlc3Npb24gZmFjdG9yeSB0byBzZWUgaWYgYW5cclxuICAgICAgICAvLyBhdXRoZW50aWNhdGVkIHVzZXIgaXMgY3VycmVudGx5IHJlZ2lzdGVyZWQuXHJcbiAgICAgICAgdGhpcy5pc0F1dGhlbnRpY2F0ZWQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAhIVNlc3Npb24udXNlcjtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmdldExvZ2dlZEluVXNlciA9IGZ1bmN0aW9uIChmcm9tU2VydmVyKSB7XHJcblxyXG4gICAgICAgICAgICAvLyBJZiBhbiBhdXRoZW50aWNhdGVkIHNlc3Npb24gZXhpc3RzLCB3ZVxyXG4gICAgICAgICAgICAvLyByZXR1cm4gdGhlIHVzZXIgYXR0YWNoZWQgdG8gdGhhdCBzZXNzaW9uXHJcbiAgICAgICAgICAgIC8vIHdpdGggYSBwcm9taXNlLiBUaGlzIGVuc3VyZXMgdGhhdCB3ZSBjYW5cclxuICAgICAgICAgICAgLy8gYWx3YXlzIGludGVyZmFjZSB3aXRoIHRoaXMgbWV0aG9kIGFzeW5jaHJvbm91c2x5LlxyXG5cclxuICAgICAgICAgICAgLy8gT3B0aW9uYWxseSwgaWYgdHJ1ZSBpcyBnaXZlbiBhcyB0aGUgZnJvbVNlcnZlciBwYXJhbWV0ZXIsXHJcbiAgICAgICAgICAgIC8vIHRoZW4gdGhpcyBjYWNoZWQgdmFsdWUgd2lsbCBub3QgYmUgdXNlZC5cclxuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmlzQXV0aGVudGljYXRlZCgpICYmIGZyb21TZXJ2ZXIgIT09IHRydWUpIHtcclxuICAgICAgICAgICAgICAgIHJldHVybiAkcS53aGVuKFNlc3Npb24udXNlcik7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIE1ha2UgcmVxdWVzdCBHRVQgL3Nlc3Npb24uXHJcbiAgICAgICAgICAgIC8vIElmIGl0IHJldHVybnMgYSB1c2VyLCBjYWxsIG9uU3VjY2Vzc2Z1bExvZ2luIHdpdGggdGhlIHJlc3BvbnNlLlxyXG4gICAgICAgICAgICAvLyBJZiBpdCByZXR1cm5zIGEgNDAxIHJlc3BvbnNlLCB3ZSBjYXRjaCBpdCBhbmQgaW5zdGVhZCByZXNvbHZlIHRvIG51bGwuXHJcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9zZXNzaW9uJykudGhlbihvblN1Y2Nlc3NmdWxMb2dpbikuY2F0Y2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmxvZ2luID0gZnVuY3Rpb24gKGNyZWRlbnRpYWxzKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAkaHR0cC5wb3N0KCcvbG9naW4nLCBjcmVkZW50aWFscylcclxuICAgICAgICAgICAgICAgIC50aGVuKG9uU3VjY2Vzc2Z1bExvZ2luKVxyXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHsgbWVzc2FnZTogJ0ludmFsaWQgbG9naW4gY3JlZGVudGlhbHMuJyB9KTtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHRoaXMubG9nb3V0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAuZ2V0KCcvbG9nb3V0JykudGhlbihmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBTZXNzaW9uLmRlc3Ryb3koKTtcclxuICAgICAgICAgICAgICAgICRyb290U2NvcGUuJGJyb2FkY2FzdChBVVRIX0VWRU5UUy5sb2dvdXRTdWNjZXNzKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICB9KTtcclxuXHJcbiAgICBhcHAuc2VydmljZSgnU2Vzc2lvbicsIGZ1bmN0aW9uICgkcm9vdFNjb3BlLCBBVVRIX0VWRU5UUykge1xyXG5cclxuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLm5vdEF1dGhlbnRpY2F0ZWQsIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgc2VsZi5kZXN0cm95KCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHNlbGYuZGVzdHJveSgpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmlkID0gbnVsbDtcclxuICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xyXG5cclxuICAgICAgICB0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uIChzZXNzaW9uSWQsIHVzZXIpIHtcclxuICAgICAgICAgICAgdGhpcy5pZCA9IHNlc3Npb25JZDtcclxuICAgICAgICAgICAgdGhpcy51c2VyID0gdXNlcjtcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB0aGlzLmRlc3Ryb3kgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHRoaXMuaWQgPSBudWxsO1xyXG4gICAgICAgICAgICB0aGlzLnVzZXIgPSBudWxsO1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgfSk7XHJcblxyXG59KSgpO1xyXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XHJcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2hvbWUnLCB7XHJcblx0XHR1cmw6ICcvaG9tZScsXHJcblx0XHR0ZW1wbGF0ZVVybDogJ2FwcC9ob21lL2hvbWUuaHRtbCcsXHJcblx0XHRyZXNvbHZlOiB7XHJcblx0XHRcdHVzZXI6IGZ1bmN0aW9uIChBdXRoU2VydmljZSkge1xyXG5cdFx0XHRcdHJldHVybiBBdXRoU2VydmljZS5nZXRMb2dnZWRJblVzZXIoKTtcclxuXHRcdFx0fSxcclxuXHRcdFx0Ly8gcmVjb21tZW5kZWRBcnRpY2xlczogZnVuY3Rpb24gKEFydGljbGVzRmFjdG9yeSkge1xyXG5cdFx0XHQvLyBcdHJldHVybiBBcnRpY2xlc0ZhY3RvcnkuZmV0Y2hSZWNvbW1lbmRlZEFydGljbGVzKCk7XHJcblx0XHRcdC8vIH0sXHJcbiAgICBcdFx0YXJ0aWNsZXM6IGZ1bmN0aW9uKEFydGljbGVzRmFjdG9yeSkge1xyXG4gICAgICAgIFx0XHRyZXR1cm4gQXJ0aWNsZXNGYWN0b3J5LmZldGNoQWxsKCk7XHJcbiAgICBcdFx0fVxyXG5cdFx0fSxcclxuXHRcdGNvbnRyb2xsZXI6ICdIb21lcGFnZUN0cmwnXHJcblx0fSk7XHJcblx0JHVybFJvdXRlclByb3ZpZGVyLndoZW4oJy8nLCAnL2hvbWUnKTtcclxuXHJcbn0pO1xyXG5cclxuYXBwLmNvbnRyb2xsZXIoJ0hvbWVwYWdlQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRyb290U2NvcGUsIHVzZXIsIGFydGljbGVzLCAkc3RhdGUpIHtcclxuXHQkc2NvcGUudXNlciA9IHVzZXI7XHJcblx0JHNjb3BlLmFydGljbGVzID0gYXJ0aWNsZXM7XHJcblxyXG5cdCRzY29wZS5saXN0QXJ0aWNsZXMgPSBmdW5jdGlvbiAoaWQpIHtcclxuXHRcdCRzdGF0ZS5nbygnYXJ0aWNsZScsIHtcclxuXHRcdFx0aWQ6IGlkXHJcblx0XHR9KTtcclxuXHR9O1xyXG5cclxuXHJcblx0JHNjb3BlLnRpbGVzID0gYnVpbGRHcmlkTW9kZWwoe1xyXG5cdFx0aWQ6IFwiXCIsXHJcblx0XHR0aXRsZTogXCJcIixcclxuXHRcdGltYWdlOiBcIlwiXHJcblx0fSk7XHJcblxyXG5cdGZ1bmN0aW9uIGJ1aWxkR3JpZE1vZGVsKHRpbGVUbXBsKSB7XHJcblx0XHR2YXIgaXQsIHJlc3VsdHMgPSBbXTtcclxuXHRcdGZvciAodmFyIGogPSAwOyBqIDwgMTE7IGorKykge1xyXG5cdFx0XHR2YXIgYXJ0aWNsZSA9IGFydGljbGVzW01hdGguZmxvb3IoYXJ0aWNsZXMubGVuZ3RoICogTWF0aC5yYW5kb20oKSldO1xyXG5cdFx0XHRpdCA9IGFuZ3VsYXIuZXh0ZW5kKHt9LCB0aWxlVG1wbCk7XHJcblx0XHRcdGl0Ll9pZCA9IGFydGljbGUuX2lkO1xyXG5cdFx0XHRpdC50aXRsZSA9IGFydGljbGUudGl0bGU7XHJcblx0XHRcdGl0LnNwYW4gPSB7XHJcblx0XHRcdFx0cm93OiAxLFxyXG5cdFx0XHRcdGNvbDogMVxyXG5cdFx0XHR9O1xyXG5cdFx0XHRpdC5pbWFnZSA9IGFydGljbGUubGVhZEltYWdlVXJsO1xyXG5cdFx0XHRzd2l0Y2ggKGogKyAxKSB7XHJcblx0XHRcdGNhc2UgMTpcclxuXHRcdFx0XHRpdC5zcGFuLnJvdyA9IGl0LnNwYW4uY29sID0gMjtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSA0OlxyXG5cdFx0XHRcdGl0LnNwYW4uY29sID0gMjtcclxuXHRcdFx0XHRicmVhaztcclxuXHRcdFx0Y2FzZSA1OlxyXG5cdFx0XHRcdGl0LnNwYW4ucm93ID0gaXQuc3Bhbi5jb2wgPSAyO1xyXG5cdFx0XHRcdGJyZWFrO1xyXG5cdFx0XHR9XHJcblx0XHRcdHJlc3VsdHMucHVzaChpdCk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gcmVzdWx0cztcclxuXHR9XHJcblxyXG59KTtcclxuIiwiKGZ1bmN0aW9uICgpIHtcclxuXHRcdC8vICd1c2Ugc3RyaWN0JztcclxuXHJcblx0XHRpZiAoIXdpbmRvdy5hbmd1bGFyKSB0aHJvdyBuZXcgRXJyb3IoJ0FuZ3VsYXIgcmVxdWlyZWQnKTtcclxuXHRcdHZhciBpZGIgPSBhbmd1bGFyLm1vZHVsZSgnZGV4aWVJZGInLCBbXSk7XHJcblxyXG5cdFx0aWRiLmZhY3RvcnkoJ2lkYlNlcnZpY2UnLCBmdW5jdGlvbiAoJGxvZywgJHEpIHtcclxuXHRcdFx0Y29uc29sZS5sb2coJ2lkYlNlcnZpY2UgbG9hZGluZy4uJyk7XHJcblx0XHRcdGlmICghd2luZG93LkRleGllKSB0aHJvdyBuZXcgRXJyb3IoJ0RleGllIG5vdCBmb3VuZCcpO1xyXG5cdFx0XHR2YXIgZGIgPSBuZXcgRGV4aWUoJ25ld3NEYicpO1xyXG5cclxuICAgICAgZGIudmVyc2lvbigxKS5zdG9yZXMoe1xyXG5cdFx0XHRcdGNhdGVnb3JpZXM6IFwiJl9pZCwgZGVzY3JpcHRpb24sIHR5cGUsICpwYWdlc1wiLFxyXG5cdFx0XHRcdHBhZ2U6IFwiKytfaWQsIF9pZCwgY29udGVudCwgZGF0ZVB1Ymxpc2hlZCwgZG9tYWluLCBleGNlcnB0LCB0aXRsZSwgdXJsLCBfX3YsIGxlYWRJbWFnZVVybFwiXHJcblx0XHRcdH0pO1xyXG5cclxuXHRcdFx0ZGIub3BlbigpLnRoZW4oZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdGRiLmNsb3NlKCk7XHJcblx0XHRcdFx0ZGIub3BlbigpLnRoZW4oZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0JGxvZy5kZWJ1ZygnT3BlbmluZyBjb25uZWN0aW9uIHRvIGluZGV4ZWREYicpO1xyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdGRiLm9uKCdibG9ja2VkJywgZnVuY3Rpb24gKGVycikge1xyXG5cdFx0XHRcdCRsb2cud2FybignYmxvY2tlZCAnLCBlcnIpO1xyXG5cdFx0XHR9KTtcclxuXHJcblx0XHRcdHJldHVybiB7XHJcblx0XHRcdFx0Z2V0QWxsOiBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gJzEyMyc7XHJcblx0XHRcdFx0fSxcclxuXHRcdFx0XHRhZGRQYWdlOiBmdW5jdGlvbiAodmFsdWUsIGlkKSB7XHJcblx0XHRcdFx0XHR2YXIgZGVmZXJyZWQgPSAkcS5kZWZlcigpO1xyXG4gICAgICAgICAgZGIucGFnZS5hZGQodmFsdWUpXHJcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICAgICAgICBkZWZlcnJlZC5yZXNvbHZlKGRhdGEpO1xyXG4gICAgICAgICAgICB9KVxyXG5cdFx0XHRcdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2U7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9O1xyXG5cdFx0fSk7XHJcblxyXG59KSgpO1xyXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xyXG5cclxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdsb2dpbicsIHtcclxuICAgICAgICB1cmw6ICcvbG9naW4nLFxyXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2xvZ2luL2xvZ2luLmh0bWwnLFxyXG4gICAgICAgIGNvbnRyb2xsZXI6ICdMb2dpbkN0cmwnXHJcbiAgICB9KTtcclxuXHJcbn0pO1xyXG5cclxuYXBwLmNvbnRyb2xsZXIoJ0xvZ2luQ3RybCcsIGZ1bmN0aW9uICgkc2NvcGUsICRyb290U2NvcGUsIEF1dGhTZXJ2aWNlLCAkc3RhdGUpIHtcclxuXHJcbiAgICAkc2NvcGUubG9naW4gPSB7fTtcclxuICAgICRzY29wZS5lcnJvciA9IG51bGw7XHJcblxyXG4gICAgJHNjb3BlLnNlbmRMb2dpbiA9IGZ1bmN0aW9uIChsb2dpbkluZm8pIHtcclxuXHJcbiAgICAgICAgJHNjb3BlLmVycm9yID0gbnVsbDtcclxuXHJcbiAgICAgICAgQXV0aFNlcnZpY2UubG9naW4obG9naW5JbmZvKS50aGVuKGZ1bmN0aW9uIChsb2dnZWRJblVzZXIpIHtcclxuICAgICAgICAgICAgJHN0YXRlLmdvKCdob21lJyk7XHJcbiAgICAgICAgICAgICRyb290U2NvcGUubG9nZ2VkSW5Vc2VyID0gbG9nZ2VkSW5Vc2VyO1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZygkcm9vdFNjb3BlLmxvZ2dlZEluVXNlcik7XHJcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAkc2NvcGUuZXJyb3IgPSAnSW52YWxpZCBsb2dpbiBjcmVkZW50aWFscy4nO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgIH07XHJcblxyXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xyXG5cclxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdtZW1iZXJzT25seScsIHtcclxuICAgICAgICB1cmw6ICcvbWVtYmVycy1hcmVhJyxcclxuICAgICAgICB0ZW1wbGF0ZTogJzxpbWcgbmctcmVwZWF0PVwiaXRlbSBpbiBzdGFzaFwiIHdpZHRoPVwiMzAwXCIgbmctc3JjPVwie3sgaXRlbSB9fVwiIC8+JyxcclxuICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbiAoJHNjb3BlLCBTZWNyZXRTdGFzaCkge1xyXG4gICAgICAgICAgICBTZWNyZXRTdGFzaC5nZXRTdGFzaCgpLnRoZW4oZnVuY3Rpb24gKHN0YXNoKSB7XHJcbiAgICAgICAgICAgICAgICAkc2NvcGUuc3Rhc2ggPSBzdGFzaDtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfSxcclxuICAgICAgICAvLyBUaGUgZm9sbG93aW5nIGRhdGEuYXV0aGVudGljYXRlIGlzIHJlYWQgYnkgYW4gZXZlbnQgbGlzdGVuZXJcclxuICAgICAgICAvLyB0aGF0IGNvbnRyb2xzIGFjY2VzcyB0byB0aGlzIHN0YXRlLiBSZWZlciB0byBhcHAuanMuXHJcbiAgICAgICAgZGF0YToge1xyXG4gICAgICAgICAgICBhdXRoZW50aWNhdGU6IHRydWVcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbn0pO1xyXG5cclxuYXBwLmZhY3RvcnkoJ1NlY3JldFN0YXNoJywgZnVuY3Rpb24gKCRodHRwKSB7XHJcblxyXG4gICAgdmFyIGdldFN0YXNoID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHJldHVybiAkaHR0cC5nZXQoJy9hcGkvbWVtYmVycy9zZWNyZXQtc3Rhc2gnKS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YTtcclxuICAgICAgICB9KTtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBnZXRTdGFzaDogZ2V0U3Rhc2hcclxuICAgIH07XHJcblxyXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xyXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NvbGxlY3Rpb25zJywge1xyXG4gICAgICAgIHVybDogJy9jb2xsZWN0aW9ucycsXHJcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvbXktY29sbGVjdGlvbnMvY29sbGVjdGlvbnMuaHRtbCcsXHJcbiAgICAgICAgcmVzb2x2ZToge1xyXG4gICAgICAgICAgICBhcnRpY2xlczogZnVuY3Rpb24oQXJ0aWNsZXNGYWN0b3J5KXtcclxuICAgICAgICAgICAgICAgIHJldHVybiBBcnRpY2xlc0ZhY3RvcnkuZmV0Y2hVc2VyQXJ0aWNsZXNQb3B1bGF0ZWQoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY29udHJvbGxlcjogJ0FydGljbGVzQ3RybCdcclxuICAgIH0pO1xyXG59KTtcclxuXHJcblxyXG4vL1xyXG4vLyBhcHAuY29udHJvbGxlcignQXJ0aWNsZUN0cmwnLCBmdW5jdGlvbigkc2NvcGUsIGFydGljbGUsICRjb21waWxlKSB7XHJcbi8vICAgICAkc2NvcGUuY3VycmVudCA9IGFydGljbGU7XHJcbi8vICAgICAkc2NvcGUudGl0bGUgPSBhcnRpY2xlLnRpdGxlO1xyXG4vLyAgICAgJHNjb3BlLmNvbnRlbnQgPSBhcnRpY2xlLmNvbnRlbnQ7XHJcbi8vIH0pO1xyXG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkc3RhdGVQcm92aWRlcikge1xyXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdvZmZsaW5lJywge1xyXG5cdFx0dXJsOiAnL29mZmxpbmUnLFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdhcHAvb2ZmbGluZS9vZmZsaW5lLmh0bWwnLFxyXG5cdH0pO1xyXG59KTtcclxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcclxuXHJcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncGFyc2VyJywge1xyXG4gICAgICAgIHVybDogJy9wYXJzZXInLFxyXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL3BhcnNlci9wYXJzZXIuaHRtbCcsXHJcbiAgICAgICAgY29udHJvbGxlcjogJ1BhcnNlckN0cmwnXHJcbiAgICB9KTtcclxuXHJcbn0pO1xyXG5cclxuYXBwLmNvbnRyb2xsZXIoJ1BhcnNlckN0cmwnLCBmdW5jdGlvbiAoJHNjb3BlLCAkc3RhdGUsIEFydGljbGVzRmFjdG9yeSwgU2Vzc2lvbikge1xyXG5cclxuICAgICRzY29wZS5wYXJzZVVybCA9IGZ1bmN0aW9uICgpIHtcclxuXHJcbiAgICAgICAgLy9jb25zb2xlLmxvZyhcImluc2lkZSBwYXJzZXJDdHJsIHBhcnNlVXJsOiBzZXNzaW9uIHVzZXI6IFwiLCBTZXNzaW9uLnVzZXIuX2lkKTtcclxuXHJcbiAgICAgICAgQXJ0aWNsZXNGYWN0b3J5LnBhcnNlVXJsKCRzY29wZS51cmwsIFNlc3Npb24udXNlci5faWQpXHJcbiAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XHJcbiAgICAgICAgICAgICRzY29wZS5wYXJzZWQgPSByZXNwb25zZTtcclxuICAgICAgICB9KVxyXG5cclxuICAgIH07XHJcblxyXG59KTtcclxuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJHN0YXRlUHJvdmlkZXIpIHtcclxuXHQkc3RhdGVQcm92aWRlclxyXG5cdFx0LnN0YXRlKCdzdWJzY3JpcHRpb25zJywge1xyXG5cdFx0XHR1cmw6ICcvc3Vic2NyaXB0aW9ucycsXHJcblx0XHRcdHRlbXBsYXRlVXJsOiAnYXBwL3N1YnNjcmlwdGlvbnMvc3Vic2NyaXB0aW9ucy5odG1sJyxcclxuXHRcdFx0cmVzb2x2ZToge1xyXG5cdFx0XHRcdGNhdGVnb3JpZXM6IGZ1bmN0aW9uKENhdGVnb3JpZXNGYWN0b3J5KXtcclxuXHRcdFx0XHRcdHJldHVybiBDYXRlZ29yaWVzRmFjdG9yeS5nZXRVc2VyU3Vic2NyaXB0aW9uc0RldGFpbGVkKCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9LFxyXG5cdFx0XHRjb250cm9sbGVyOiAnU3Vic2NyaXB0aW9uc0N0cmwnXHJcblx0XHR9KVxyXG5cclxuXHRcdC5zdGF0ZSgnc3Vic2NyaXB0aW9ucy5zZWN0aW9uJywge1xyXG5cdFx0XHRwYXJlbnQ6ICdzdWJzY3JpcHRpb25zJyxcclxuXHRcdFx0dXJsOiAnLzpuYW1lJyxcclxuXHRcdFx0dGVtcGxhdGVVcmw6ICdhcHAvc3Vic2NyaXB0aW9ucy9zdWJzY3JpcHRpb25zLmh0bWwnLFxyXG5cdFx0XHRjb250cm9sbGVyOiAnU3Vic2NyaXB0aW9uU2VjdGlvbkN0cmwnXHJcblx0XHR9KVxyXG59KTtcclxuXHJcblxyXG5hcHAuY29udHJvbGxlcignU3Vic2NyaXB0aW9uc0N0cmwnLCBmdW5jdGlvbigkc2NvcGUsIGNhdGVnb3JpZXMsIENhdGVnb3JpZXNGYWN0b3J5KSB7XHJcblxyXG5cdCRzY29wZS5jYXRlZ29yaWVzID0gY2F0ZWdvcmllcztcclxuXHJcblx0JHNjb3BlLnJlbW92ZUZyb21TdWJzY3JpcHRpb24gPSBmdW5jdGlvbihjYXRlZ29yeUlkLCBwYWdlSWQpe1xyXG5cdFx0dmFyIGNJZCA9IGNhdGVnb3J5SWQuY2F0ZWdvcnlJZDsgdmFyIHBJZCA9IHBhZ2VJZC5wYWdlSWQ7XHJcblx0XHRjb25zb2xlLmxvZyhcIlN1YnNjcmlwdGlvbnMgQ29udHJvbCAtIFJlbW92ZSBGcm9tXFxuXCIgKyBcImNhdGVnb3J5SWRcIiwgY0lkLCBcInBhZ2VJZFwiLCBwSWQpXHJcblx0XHRDYXRlZ29yaWVzRmFjdG9yeS5yZW1vdmVGcm9tU3Vic2NyaXB0aW9uKGNJZCwgcElkKTtcclxuXHR9XHJcblxyXG59KTtcclxuXHJcbmFwcC5jb250cm9sbGVyKCdTdWJzY3JpcHRpb25TZWN0aW9uQ3RybCcsIGZ1bmN0aW9uKCRzY29wZSwgJHN0YXRlUGFyYW1zLCBjYXRlZ29yaWVzKXtcclxuXHR2YXIgc3Vic2NyaXB0aW9uSW5kZXggPSBjYXRlZ29yaWVzLm1hcChmdW5jdGlvbihlbGVtZW50KXtcclxuXHRcdHJldHVybiBlbGVtZW50LmRlc2NyaXB0aW9uLnRvTG93ZXJDYXNlKCk7XHJcblx0fSkuaW5kZXhPZigkc3RhdGVQYXJhbXMubmFtZS50b0xvd2VyQ2FzZSgpKTtcclxuXHJcblx0JHNjb3BlLmNhdGVnb3JpZXMgPSBbY2F0ZWdvcmllc1tzdWJzY3JpcHRpb25JbmRleF1dO1xyXG59KTsiLCJhcHAuZmFjdG9yeSgnQXJ0aWNsZXNGYWN0b3J5JywgZnVuY3Rpb24gKCRodHRwLCAkc3RhdGUpIHtcclxuXHR2YXIgQXJ0aWNsZXNGYWN0b3J5ID0ge307XHJcblx0dmFyIGFsbEFydGljbGVzQ2FjaGUgPSBbXTtcclxuXHR2YXIgdXNlckFydGljbGVzQ2FjaGUgPSBbXTtcclxuXHR2YXIgdXNlckFydGljbGVzQXJyYXkgPSBbXTtcclxuXHR2YXIgcmVjb21tZW5kZWRBcnRpY2xlc0NhY2hlID0gW107XHJcblxyXG5cdEFydGljbGVzRmFjdG9yeS5mZXRjaEFsbCA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiAkaHR0cC5nZXQoXCIvYXBpL3BhZ2VzXCIpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG5cdFx0XHRcdGlmIChhbGxBcnRpY2xlc0NhY2hlICE9PSByZXNwb25zZS5kYXRhKSB7XHJcblx0XHRcdFx0XHRhbmd1bGFyLmNvcHkocmVzcG9uc2UuZGF0YSwgYWxsQXJ0aWNsZXNDYWNoZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiBhbGxBcnRpY2xlc0NhY2hlO1xyXG5cdFx0XHR9KVxyXG5cdH1cclxuXHJcblx0QXJ0aWNsZXNGYWN0b3J5LmZldGNoUmVjb21tZW5kZWRBcnRpY2xlcyA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiAkaHR0cC5nZXQoXCIvYXBpL3BhZ2VzL3JlY29tbWVuZGVkXCIpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XHJcblx0XHRcdFx0aWYgKHJlY29tbWVuZGVkQXJ0aWNsZXNDYWNoZSAhPT0gcmVzcG9uc2UuZGF0YSkge1xyXG5cdFx0XHRcdFx0YW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEsIHJlY29tbWVuZGVkQXJ0aWNsZXNDYWNoZSk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJldHVybiByZWNvbW1lbmRlZEFydGljbGVzQ2FjaGU7XHJcblx0XHRcdH0pXHJcblx0XHRcdC5jYXRjaChmdW5jdGlvbihlcnIpIHtcclxuXHRcdFx0XHQkc3RhdGUuZ28oJ2FydGljbGVzJyk7XHJcblx0XHRcdH0pXHJcblx0fVxyXG5cclxuXHQvL0NhbiBlaXRoZXIgcHJvdmlkZSBuYW1lIG9yIGlkIGFzIHBhcmFtZXRlciAoaS5lLiBvYmogPSB7bmFtZTogXCJUZWNobm9sb2d5XCJ9KVxyXG5cdEFydGljbGVzRmFjdG9yeS5mZXRjaEFsbEJ5Q2F0ZWdvcnkgPSBmdW5jdGlvbiAob2JqKSB7XHJcblx0XHR2YXIgdXJsU3RyaW5nID0gXCIvYXBpL3BhZ2VzL2NhdGVnb3J5P1wiXHJcblx0XHRmb3IgKHZhciBrZXkgaW4gb2JqKSB7XHJcblx0XHRcdHZhciBxdWVyeVBhcmFtZXRlciA9IGtleSArIFwiPVwiICsgb2JqW2tleV07XHJcblx0XHRcdHVybFN0cmluZyArPSBxdWVyeVBhcmFtZXRlcjtcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KHVybFN0cmluZylcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcblx0XHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGE7XHJcblx0XHRcdH0pXHJcblx0fTtcclxuXHJcblx0QXJ0aWNsZXNGYWN0b3J5LmZldGNoQ2F0ZWdvcmllcyA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiAkaHR0cC5nZXQoXCIvYXBpL2NhdGVnb3JpZXMvXCIpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdmYWN0b3J5IGRhdGEsICcsIHJlc3BvbnNlLmRhdGEpXHJcblx0XHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGE7XHJcblx0XHRcdH0pXHJcblx0XHRcdC5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coXCJObyBjb25uZWN0aW9uOiBcIiwgZXJyKTtcclxuXHRcdFx0fSk7XHJcblxyXG5cdH1cclxuXHJcblx0QXJ0aWNsZXNGYWN0b3J5LmZldGNoQXJ0aWNsZUJ5SWQgPSBmdW5jdGlvbiAoaWQpIHtcclxuXHRcdHJldHVybiAkaHR0cC5nZXQoXCIvYXBpL3BhZ2VzL1wiICsgaWQpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG5cdFx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhO1xyXG5cdFx0XHR9KVxyXG5cdFx0XHQuY2F0Y2goZnVuY3Rpb24gKGVycikge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdObyByZXNwb25zZSBmcm9tIHNlcnZlci4uIHNlcnZpbmcgZnJvbSBvYmplY3QgY2FjaGU6ICcsIGVycik7XHJcblx0XHRcdFx0dmFyIGZvdW5kQXJ0aWNsZSA9IF8uZmluZChhbGxBcnRpY2xlc0NhY2hlLCBmdW5jdGlvbiAoYXJ0aWNsZSkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIGFydGljbGUuX2lkID09PSBpZFxyXG5cdFx0XHRcdH0pO1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKGZvdW5kQXJ0aWNsZSk7XHJcblx0XHRcdFx0cmV0dXJuIGZvdW5kQXJ0aWNsZVxyXG5cdFx0XHR9KVxyXG5cdH07XHJcblxyXG5cclxuXHRBcnRpY2xlc0ZhY3RvcnkuYWRkQXJ0aWNsZVRvQ2F0ZWdvcnkgPSBmdW5jdGlvbiAodXJsLCBjYXRlZ29yeSkge1xyXG5cdFx0Ly8gYWRkIG9uZSBhcnRpY2xlIHRvIGNhdGVnb3J5XHJcblx0fTtcclxuXHJcblxyXG5cclxuXHRBcnRpY2xlc0ZhY3Rvcnkuc2F2ZUFydGljbGVCeVVybCA9IGZ1bmN0aW9uICh1cmwsIGNhdGVnb3J5KSB7XHJcblx0XHQvLyBkZWZhdWx0IHRvIGFsbCwgb3Igb3B0aW9uYWwgY2F0ZWdvcnlcclxuXHR9XHJcblxyXG5cdC8vTWV0aG9kcyBmb3IgY3VycmVudCAobG9nZ2VkIGluIHVzZXIpXHJcblx0QXJ0aWNsZXNGYWN0b3J5LmZldGNoVXNlckFydGljbGVzQXJyYXkgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KCdhcGkvcGFnZXMvdXNlci9tZScpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xyXG5cdFx0XHRcdGlmIChyZXNwb25zZS5kYXRhICE9PSB1c2VyQXJ0aWNsZXNBcnJheSkge1xyXG5cdFx0XHRcdFx0YW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEsIHVzZXJBcnRpY2xlc0FycmF5KTtcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIHVzZXJBcnRpY2xlc0FycmF5O1xyXG5cdFx0XHR9KVxyXG5cdH1cclxuXHJcblx0QXJ0aWNsZXNGYWN0b3J5LmZldGNoVXNlckFydGljbGVzUG9wdWxhdGVkID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0cmV0dXJuICRodHRwLmdldCgnYXBpL3VzZXJzL21lJylcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcblx0XHRcdFx0YW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEucGFnZXMsIHVzZXJBcnRpY2xlc0NhY2hlKVxyXG5cdFx0XHRcdHJldHVybiB1c2VyQXJ0aWNsZXNDYWNoZVxyXG5cdFx0XHR9KVxyXG5cdFx0XHQuY2F0Y2goZnVuY3Rpb24oZXJyKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ05vIGludGVybmV0IGNvbm5lY3Rpb24sIHJldHVybmluZyBzdGFsZSBkYXRhLi4nKVxyXG5cdFx0XHRcdHJldHVybiB1c2VyQXJ0aWNsZXNDYWNoZTtcclxuXHRcdFx0fSlcclxuXHR9XHJcblxyXG5cdC8vIFRPRE86IHN5bmMgd2hlbiBiYWNrIG9ubGluZS4uLlxyXG5cdEFydGljbGVzRmFjdG9yeS5mYXZvcml0ZUFydGljbGUgPSBmdW5jdGlvbiAoYXJ0aWNsZSkge1xyXG5cdFx0dmFyIHJlZjtcclxuXHRcdGlmICh0eXBlb2YgYXJ0aWNsZSA9PT0gJ3N0cmluZycpIHtcclxuXHRcdFx0cmVmID0gXy5maW5kKGFsbEFydGljbGVzQ2FjaGUsIGZ1bmN0aW9uKGFydCkge1xyXG5cdFx0XHRcdHJldHVybiBhcnQuX2lkID09PSBhcnRpY2xlO1xyXG5cdFx0XHR9KTtcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHJlZiA9IGFydGljbGU7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gJGh0dHAucHV0KCdhcGkvcGFnZXMvJyArIHJlZi5faWQgKyAnL2Zhdm9yaXRlJylcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ0FkZGluZyB0byBjYWNoZS4uLicpO1xyXG5cdFx0XHRcdHVzZXJBcnRpY2xlc0NhY2hlLnB1c2gocmVmKTtcclxuXHRcdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcclxuXHRcdFx0fSlcclxuXHR9XHJcblx0Ly8gVE9ETzogc3luYyB3aGVuIGJhY2sgb25saW5lLi4uXHJcblx0QXJ0aWNsZXNGYWN0b3J5LnVuZmF2b3JpdGVBcnRpY2xlID0gZnVuY3Rpb24gKGlkKSB7XHJcblx0XHRyZXR1cm4gJGh0dHAucHV0KCdhcGkvcGFnZXMvJyArIGlkICsgJy91bmZhdm9yaXRlJylcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XHJcblx0XHRcdFx0Xy5yZW1vdmUodXNlckFydGljbGVzQ2FjaGUsIGZ1bmN0aW9uIChhcnRpY2xlKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gaWQgPT09IGFydGljbGUuX2lkXHJcblx0XHRcdFx0fSlcclxuXHRcdFx0XHRjb25zb2xlLmxvZygndW5mYXY6ICcsIHVzZXJBcnRpY2xlc0NhY2hlKVxyXG5cdFx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhO1xyXG5cdFx0XHR9KVxyXG5cdH1cclxuXHJcblx0Ly9SZW1vdmUgYXJ0aWNsZSBmcm9tIHVzZXIncyBsaXN0LCBub3QgZGVsZXRlLlxyXG5cdC8vIEFydGljbGVzRmFjdG9yeS5yZW1vdmVBcnRpY2xlQnlJRCA9IGZ1bmN0aW9uIChpZCkge1xyXG5cdC8vIFx0cmV0dXJuICRodHRwLnB1dCgnL3VzZXJzL3JlbW92ZVBhZ2UvJyArIGlkKVxyXG5cdC8vIFx0XHQudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuXHQvLyBcdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcclxuXHQvLyBcdFx0fSlcclxuXHQvLyB9O1xyXG5cclxuXHRBcnRpY2xlc0ZhY3RvcnkucGFyc2VVcmwgPSBmdW5jdGlvbiAodXJsLCB1c2VyaWQsIGNhdGVnb3JpZXMpIHtcclxuXHRcdC8vMS4gcGFyc2UgdGhlIFVybFxyXG5cdFx0Ly8yLiBwb3N0IHRvIHBhZ2VzXHJcblx0XHQvLzMuIGFkZCBwYWdlIHRvIHVzZXIncyBsaXN0XHJcblx0XHQvLzQuIGFkZCBwYWdlIHRvIGNhdGVnb3JpZXNcclxuXHJcblx0XHR2YXIgZW5jb2RlZCA9IGVuY29kZVVSSUNvbXBvbmVudCh1cmwpO1xyXG5cdFx0cmV0dXJuICRodHRwLmdldChcIi9hcGkvcGFyc2VyL1wiICsgZW5jb2RlZClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24gKHJlc3VsdCkge1xyXG5cdFx0XHRcdC8vY29uc29sZS5sb2coXCJ1c2VyaWQ6IFwiLCB1c2VyaWQpO1xyXG5cdFx0XHRcdHJldHVybiAkaHR0cC5wb3N0KFwiL2FwaS9wYWdlc1wiLCByZXN1bHQuZGF0YSlcclxuXHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uIChwYWdlUmVzcG9uc2UpIHtcclxuXHRcdFx0XHRcdFx0Ly9jb25zb2xlLmxvZyhcInBhZ2UgcGFyc2VkOiBcIiwgcGFnZVJlc3BvbnNlLmRhdGEpO1xyXG5cdFx0XHRcdFx0XHRyZXR1cm4gJGh0dHAucHV0KFwiL2FwaS91c2Vycy9hZGRQYWdlL1wiICsgdXNlcmlkLCB7XHJcblx0XHRcdFx0XHRcdFx0XHRwYWdlOiBwYWdlUmVzcG9uc2UuZGF0YS5faWRcclxuXHRcdFx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uIChyZXMpIHtcclxuXHRcdFx0XHRcdFx0XHRcdGlmIChjYXRlZ29yaWVzKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdHZhciB0b1VwZGF0ZSA9IFtdO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGNhdGVnb3JpZXMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHQvL2NvbnNvbGUubG9nKFwiYWRkaW5nIHBhZ2UgdG8gY2F0ZWdvcnk6IFwiLCBjYXRlZ29yaWVzW2ldKTtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHR0b1VwZGF0ZS5wdXNoKCRodHRwLnB1dChcIi9hcGkvY2F0ZWdvcmllcy9hZGRQYWdlL1wiICsgY2F0ZWdvcmllc1tpXSwge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0cGFnZTogcGFnZVJlc3BvbnNlLmRhdGEuX2lkXHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0fSkpO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHR9XHJcblx0XHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFwidG9VcGRhdGU6IFwiLCB0b1VwZGF0ZSk7XHJcblx0XHRcdFx0XHRcdFx0XHRcdHJldHVybiBQcm9taXNlLmFsbCh0b1VwZGF0ZSlcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHQudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKFwiYWxsIGNhdGVnb3JpZXMgdXBkYXRlZFwiKTtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRcdGlmICghY2hlY2tQYWdlQ2FjaGVDb250YWlucyhwYWdlUmVzcG9uc2UuZGF0YS5faWQpKSB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdGNvbnNvbGUubG9nKCdOb3QgZm91bmQsIGFkZCB0byBjYWNoZScpO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0XHRwYWdlUmVzcG9uc2UuZGF0YS5saWtlZCA9IHRydWU7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0XHRcdHVzZXJBcnRpY2xlc0NhY2hlLnB1c2gocGFnZVJlc3BvbnNlLmRhdGEpO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIHBhZ2VSZXNwb25zZS5kYXRhO1xyXG5cdFx0XHRcdFx0XHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0XHRcdFx0XHQvLyB1c2VyQXJ0aWNsZXNDYWNoZS5wdXNoKClcclxuXHRcdFx0XHRcdFx0XHRcdFx0Y29uc29sZS5sb2coJ05ldyBwYWdlIGFkZGVkOiAnLCBwYWdlUmVzcG9uc2UuZGF0YSlcclxuXHRcdFx0XHRcdFx0XHRcdFx0aWYgKCFjaGVja1BhZ2VDYWNoZUNvbnRhaW5zKHBhZ2VSZXNwb25zZS5kYXRhLl9pZCkpIHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRjb25zb2xlLmxvZygnTm90IGZvdW5kLCBhZGQgdG8gY2FjaGUnKTtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRwYWdlUmVzcG9uc2UuZGF0YS5saWtlZCA9IHRydWU7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0dXNlckFydGljbGVzQ2FjaGUucHVzaChwYWdlUmVzcG9uc2UuZGF0YSk7XHJcblx0XHRcdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIHBhZ2VSZXNwb25zZS5kYXRhO1xyXG5cdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHR9KTtcclxuXHR9O1xyXG5cclxuXHRmdW5jdGlvbiBjaGVja1BhZ2VDYWNoZUNvbnRhaW5zKGlkKSB7XHJcblx0XHRyZXR1cm4gXy5jb250YWlucyh1c2VyQXJ0aWNsZXNDYWNoZSwgZnVuY3Rpb24gKGFydGljbGUpIHtcclxuXHRcdFx0cmV0dXJuIGFydGljbGUuX2lkID09PSBpZDtcclxuXHRcdH0pO1xyXG5cdH07XHJcblxyXG5cdHJldHVybiBBcnRpY2xlc0ZhY3Rvcnk7XHJcbn0pXHJcbiIsImFwcC5mYWN0b3J5KCdDYXRlZ29yaWVzRmFjdG9yeScsIGZ1bmN0aW9uICgkaHR0cCkge1xyXG5cdHZhciBDYXRlZ29yaWVzRmFjdG9yeSA9IHt9O1xyXG5cdHZhciBjdXJyZW50U3Vic2NyaXB0aW9ucyA9IFtdO1xyXG5cdHZhciBjdXJyZW50U3Vic2NyaXB0aW9uc0RldGFpbGVkID0gW107XHJcblx0dmFyIGN1cnJlbnRGb2xkZXJzRGV0YWlsZWQgPSBbXTtcclxuXHR2YXIgY3VycmVudEZvbGRlcnMgPSBbXTtcclxuXHJcblx0Q2F0ZWdvcmllc0ZhY3RvcnkuZ2V0VXNlclN1YnNjcmlwdGlvbnMgPSBmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS9zdWJzY3JpcHRpb25zL3VzZXIvbWUnKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xyXG5cdFx0XHRpZiAocmVzcG9uc2UuZGF0YSAhPT0gY3VycmVudFN1YnNjcmlwdGlvbnMpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnVXNlciBzdWJzY3JpcHRpb25zIHJldHJpZXZlZDogJywgcmVzcG9uc2UuZGF0YSk7XHJcblx0XHRcdFx0YW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEsIGN1cnJlbnRTdWJzY3JpcHRpb25zKTtcclxuXHRcdFx0fVxyXG5cdFx0ICByZXR1cm4gY3VycmVudFN1YnNjcmlwdGlvbnM7XHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0Q2F0ZWdvcmllc0ZhY3RvcnkuZ2V0VXNlclN1YnNjcmlwdGlvbnNEZXRhaWxlZCA9IGZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL3N1YnNjcmlwdGlvbnMvdXNlci9tZT9sb25nPXRydWUnKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xyXG5cdFx0XHRpZiAocmVzcG9uc2UuZGF0YSAhPT0gY3VycmVudFN1YnNjcmlwdGlvbnNEZXRhaWxlZCkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdEZXRhaWxlZCBzdWJzY3JpcHRpb25zIHJldHJpZXZlZDogJywgcmVzcG9uc2UuZGF0YSk7XHJcblx0XHRcdFx0YW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEsIGN1cnJlbnRTdWJzY3JpcHRpb25zRGV0YWlsZWQpO1xyXG5cdFx0XHR9XHJcblx0XHQgIHJldHVybiBjdXJyZW50U3Vic2NyaXB0aW9uc0RldGFpbGVkO1xyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdC8vU2Vjb25kIHBhcmFtZXRlciBvcHRpb25hbFxyXG5cdENhdGVnb3JpZXNGYWN0b3J5LmNyZWF0ZU5ld1N1YnNjcmlwdGlvbiA9IGZ1bmN0aW9uKG5hbWUsIHBhZ2VJZCl7XHJcblx0XHR2YXIgZGF0YSA9IHtkZXNjcmlwdGlvbjogbmFtZX07XHJcblx0XHRpZihwYWdlSWQpIGRhdGEucGFnZSA9IHBhZ2VJZFxyXG5cclxuXHRcdHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL3N1YnNjcmlwdGlvbnMvJywgZGF0YSlcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcclxuXHRcdFx0aWYgKGN1cnJlbnRTdWJzY3JpcHRpb25zLmluZGV4T2YocmVzcG9uc2UuZGF0YSkgPT09IC0xKSB7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coJ05ldyBzdWJzY3JpcHRpb24gYWRkZWQ6ICcsIHJlc3BvbnNlLmRhdGEpO1xyXG5cdFx0XHRcdGN1cnJlbnRTdWJzY3JpcHRpb25zLnB1c2gocmVzcG9uc2UuZGF0YSk7XHJcblx0XHRcdH1cclxuXHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGE7XHJcblx0XHR9KVxyXG5cdH1cclxuXHQvLyB0aGlzIGN1cnJlbnRseSBvbmx5IGFkZHMgdGhlIGFydGljbGUgSUQgdG8gYW4gYXJyYXkgb2YgcGFnZXMgYXNzb2NpYXRlZCB3aXRoIGEgc3Vic2NyaXB0aW9uLlxyXG5cdC8vIGRvZXMgbm90IHVwZGF0ZSB0aGUgZGV0YWlsZWQgY2F0ZWdvcmllcy5cclxuXHRDYXRlZ29yaWVzRmFjdG9yeS5hZGRUb1N1YnNjcmlwdGlvbiA9IGZ1bmN0aW9uKGNhdGVnb3J5SWQsIGFydGljbGVJZCl7XHJcblx0XHR2YXIgZGF0YSA9IHtwYWdlOiBhcnRpY2xlSWR9O1xyXG5cdFx0cmV0dXJuICRodHRwLnB1dCgnL2FwaS9zdWJzY3JpcHRpb25zLycgKyBjYXRlZ29yeUlkLCBkYXRhKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xyXG5cdFx0XHR2YXIgaWR4ID0gXy5jaGFpbihjdXJyZW50U3Vic2NyaXB0aW9ucykucGx1Y2soJ19pZCcpLmluZGV4T2YoY2F0ZWdvcnlJZCkudmFsdWUoKTtcclxuXHRcdFx0aWYgKGlkeCAhPT0gLTEpIHtcclxuXHRcdFx0XHRpZiAoY3VycmVudFN1YnNjcmlwdGlvbnNbaWR4XS5wYWdlcy5pbmRleE9mKGFydGljbGVJZCkgPT09IC0xKSB7XHJcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnUGFnZSBhZGRlZCB0byBzdWJzY3JpcHRpb246ICcsIHJlc3BvbnNlLmRhdGEpO1xyXG5cdFx0XHRcdFx0Y3VycmVudFN1YnNjcmlwdGlvbnNbaWR4XS5wYWdlcy5wdXNoKGFydGljbGVJZCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhO1xyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdENhdGVnb3JpZXNGYWN0b3J5LnJlbW92ZUZyb21TdWJzY3JpcHRpb24gPSBmdW5jdGlvbihjYXRlZ29yeUlkLCBhcnRpY2xlSWQpe1xyXG5cdFx0cmV0dXJuICRodHRwLmRlbGV0ZSgnL2FwaS9zdWJzY3JpcHRpb25zLycgKyBjYXRlZ29yeUlkICsgJy9wYWdlcy8nICsgYXJ0aWNsZUlkKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xyXG5cclxuXHRcdFx0Ly9HZXQgaW5kZXggb2YgY2F0ZWdvcnlcclxuXHRcdFx0dmFyIGNzSW5kZXggPSBfLmNoYWluKGN1cnJlbnRTdWJzY3JpcHRpb25zKS5wbHVjaygnX2lkJykuaW5kZXhPZihjYXRlZ29yeUlkKS52YWx1ZSgpO1xyXG5cdFx0XHR2YXIgY3NkSW5kZXggPSBfLmNoYWluKGN1cnJlbnRTdWJzY3JpcHRpb25zRGV0YWlsZWQpLnBsdWNrKCdfaWQnKS5pbmRleE9mKGNhdGVnb3J5SWQpLnZhbHVlKCk7XHJcblxyXG5cdFx0XHQvL0dldCBpbmRleCBvZiBwYWdlIGluIGNhdGVnb3J5J3MgJ3BhZ2VzJyBhcnJheVxyXG5cdFx0XHR2YXIgY3NQYWdlSW5kZXggPSBjdXJyZW50U3Vic2NyaXB0aW9uc1tjc0luZGV4XS5wYWdlcy5pbmRleE9mKGFydGljbGVJZCk7XHJcblx0XHRcdHZhciBjc2RQYWdlSW5kZXggPSBfLmNoYWluKGN1cnJlbnRTdWJzY3JpcHRpb25zRGV0YWlsZWRbY3NkSW5kZXhdLnBhZ2VzKS5wbHVjaygnX2lkJykuaW5kZXhPZihhcnRpY2xlSWQpLnZhbHVlKCk7XHJcblxyXG5cdFx0XHQvL1JlbW92ZSBwYWdlIGZyb20gaW5kZXhcclxuXHRcdFx0Y3VycmVudFN1YnNjcmlwdGlvbnNbY3NJbmRleF0ucGFnZXMuc3BsaWNlKGNzUGFnZUluZGV4LCAxKTtcclxuXHRcdFx0Y3VycmVudFN1YnNjcmlwdGlvbnNEZXRhaWxlZFtjc2RJbmRleF0ucGFnZXMuc3BsaWNlKGNzZFBhZ2VJbmRleCwgMSk7XHJcblxyXG5cdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHQvL0lmIHVzZXIgaXMgYWRtaW4sIHRoaXMgZGVsZXRlcyB0aGUgc3Vic2NyaXB0aW9uXHJcblx0Q2F0ZWdvcmllc0ZhY3RvcnkucmVtb3ZlU3Vic2NyaXB0aW9uID0gZnVuY3Rpb24oaWQpe1xyXG5cdFx0cmV0dXJuICRodHRwLmRlbGV0ZSgnL2FwaS9zdWJzY3JpcHRpb25zLycgKyBpZClcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcclxuXHRcdFx0Xy5yZW1vdmUoY3VycmVudFN1YnNjcmlwdGlvbnMsIGZ1bmN0aW9uKHN1YnNjcmlwdGlvbikge1xyXG5cdFx0XHRcdHJldHVybiBzdWJzY3JpcHRpb24uX2lkID09PSBpZDtcclxuXHRcdFx0fSlcclxuXHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGE7XHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0Ly8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxyXG5cdC8vIEZJWE1FOiBTb21ldGltZXMgZGF0YSByZXRyaWV2ZWQgaXMgdmlhIFNlcnZpY2VXb3JrZXItIHdoaWNoIGVuZHMgdXAgYmVpbmcgc3RhbGUuXHJcblx0Q2F0ZWdvcmllc0ZhY3RvcnkuZ2V0VXNlckZvbGRlcnMgPSBmdW5jdGlvbigpe1xyXG5cdFx0cmV0dXJuICRodHRwLmdldCgnL2FwaS9mb2xkZXJzL3VzZXIvbWUnKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xyXG5cdFx0XHRpZiAocmVzcG9uc2UuZGF0YSAhPT0gY3VycmVudEZvbGRlcnMpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnVXNlciBmb2xkZXJzIHJldHJpZXZlZDogJywgcmVzcG9uc2UuZGF0YSk7XHJcblx0XHRcdFx0YW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEsIGN1cnJlbnRGb2xkZXJzKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gY3VycmVudEZvbGRlcnM7XHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0Q2F0ZWdvcmllc0ZhY3RvcnkuZ2V0VXNlckZvbGRlcnNEZXRhaWxlZCA9IGZ1bmN0aW9uKCl7XHJcblx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYXBpL2ZvbGRlcnMvdXNlci9tZT9sb25nPXRydWUnKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xyXG5cdFx0XHRpZiAocmVzcG9uc2UuZGF0YSAhPT0gY3VycmVudEZvbGRlcnNEZXRhaWxlZCkge1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKCdEZXRhaWxlZCBVc2VyIGZvbGRlcnMgcmV0cmlldmVkOiAnLCByZXNwb25zZS5kYXRhKTtcclxuXHRcdFx0XHRhbmd1bGFyLmNvcHkocmVzcG9uc2UuZGF0YSwgY3VycmVudEZvbGRlcnNEZXRhaWxlZCk7XHJcblx0XHRcdH1cclxuXHRcdCAgcmV0dXJuIGN1cnJlbnRGb2xkZXJzRGV0YWlsZWQ7XHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0Q2F0ZWdvcmllc0ZhY3RvcnkuY3JlYXRlTmV3Rm9sZGVyID0gZnVuY3Rpb24obmFtZSwgcGFnZUlkKXtcclxuXHRcdHZhciBkYXRhID0ge2Rlc2NyaXB0aW9uOiBuYW1lfTtcclxuXHRcdGlmKHBhZ2VJZCkgZGF0YS5wYWdlID0gcGFnZUlkXHJcblxyXG5cdFx0cmV0dXJuICRodHRwLnBvc3QoJy9hcGkvZm9sZGVycy8nLCBkYXRhKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xyXG5cdFx0XHRpZiAoY3VycmVudEZvbGRlcnMuaW5kZXhPZihyZXNwb25zZS5kYXRhKSA9PT0gLTEpIHtcclxuXHRcdFx0XHRjb25zb2xlLmxvZygnTmV3IGZvbGRlciBhZGRlZDogJywgcmVzcG9uc2UuZGF0YSk7XHJcblx0XHRcdFx0Y3VycmVudEZvbGRlcnMucHVzaChyZXNwb25zZS5kYXRhKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHRDYXRlZ29yaWVzRmFjdG9yeS5hZGRUb0ZvbGRlciA9IGZ1bmN0aW9uKGNhdGVnb3J5SWQsIGFydGljbGVJZCl7XHJcblx0XHR2YXIgZGF0YSA9IHtwYWdlOiBhcnRpY2xlSWR9O1xyXG5cdFx0cmV0dXJuICRodHRwLnB1dCgnL2FwaS9mb2xkZXJzLycgKyBjYXRlZ29yeUlkLCBkYXRhKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xyXG5cdFx0XHR2YXIgaWR4ID0gXy5jaGFpbihjdXJyZW50Rm9sZGVycykucGx1Y2soJ19pZCcpLmluZGV4T2YoY2F0ZWdvcnlJZCkudmFsdWUoKTtcclxuXHRcdFx0aWYgKGlkeCAhPT0gLTEpIHtcclxuXHRcdFx0XHRpZiAoY3VycmVudEZvbGRlcnNbaWR4XS5wYWdlcy5pbmRleE9mKGFydGljbGVJZCkgPT09IC0xKSB7XHJcblx0XHRcdFx0XHRjb25zb2xlLmxvZygnUGFnZSBhZGRlZCB0byBzdWJzY3JpcHRpb246ICcsIHJlc3BvbnNlLmRhdGEpO1xyXG5cdFx0XHRcdFx0Y3VycmVudEZvbGRlcnNbaWR4XS5wYWdlcy5wdXNoKGFydGljbGVJZCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhO1xyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdENhdGVnb3JpZXNGYWN0b3J5LnJlbW92ZUZyb21Gb2xkZXIgPSBmdW5jdGlvbihjYXRlZ29yeUlkLCBhcnRpY2xlSWQpe1xyXG5cclxuXHRcdHJldHVybiAkaHR0cC5kZWxldGUoJy9hcGkvZm9sZGVycy8nICsgY2F0ZWdvcnlJZCArICcvcGFnZXMvJyArIGFydGljbGVJZClcclxuXHRcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcclxuXHJcblx0XHRcdC8vR2V0IGluZGV4IG9mIGNhdGVnb3J5XHJcblx0XHRcdHZhciBjZkluZGV4ID0gXy5jaGFpbihjdXJyZW50Rm9sZGVycykucGx1Y2soJ19pZCcpLmluZGV4T2YoY2F0ZWdvcnlJZCkudmFsdWUoKTtcclxuXHRcdFx0dmFyIGNmZEluZGV4ID0gXy5jaGFpbihjdXJyZW50Rm9sZGVyc0RldGFpbGVkKS5wbHVjaygnX2lkJykuaW5kZXhPZihjYXRlZ29yeUlkKS52YWx1ZSgpO1xyXG5cclxuXHRcdFx0Ly9HZXQgaW5kZXggb2YgcGFnZSBpbiBjYXRlZ29yeSdzICdwYWdlcycgYXJyYXlcclxuXHRcdFx0dmFyIGNmUGFnZUluZGV4ID0gY3VycmVudEZvbGRlcnNbY2ZJbmRleF0ucGFnZXMuaW5kZXhPZihhcnRpY2xlSWQpO1xyXG5cdFx0XHR2YXIgY2ZkUGFnZUluZGV4ID0gXy5jaGFpbihjdXJyZW50Rm9sZGVyc0RldGFpbGVkW2NmZEluZGV4XS5wYWdlcykucGx1Y2soJ19pZCcpLmluZGV4T2YoYXJ0aWNsZUlkKS52YWx1ZSgpO1xyXG5cclxuXHRcdFx0Ly9SZW1vdmUgcGFnZSBmcm9tIGluZGV4XHJcblx0XHRcdGN1cnJlbnRGb2xkZXJzW2NmSW5kZXhdLnBhZ2VzLnNwbGljZShjZlBhZ2VJbmRleCwgMSk7XHJcblx0XHRcdGN1cnJlbnRGb2xkZXJzRGV0YWlsZWRbY2ZkSW5kZXhdLnBhZ2VzLnNwbGljZShjZmRQYWdlSW5kZXgsIDEpO1xyXG5cclxuXHJcblx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhO1xyXG5cdFx0fSlcclxuXHR9XHJcblxyXG5cdENhdGVnb3JpZXNGYWN0b3J5LnJlbW92ZUZvbGRlciAgPSBmdW5jdGlvbihpZCl7XHJcblx0XHRyZXR1cm4gJGh0dHAuZGVsZXRlKCcvYXBpL2ZvbGRlcnMvJyArIGlkKVxyXG5cdFx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xyXG5cdFx0XHRfLnJlbW92ZShjdXJyZW50Rm9sZGVycywgZnVuY3Rpb24oZm9sZGVyKSB7XHJcblx0XHRcdFx0cmV0dXJuIGZvbGRlci5faWQgPT09IGlkO1xyXG5cdFx0XHR9KVxyXG5cdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YTtcclxuXHRcdH0pXHJcblx0fVxyXG5cclxuXHRyZXR1cm4gQ2F0ZWdvcmllc0ZhY3Rvcnk7XHJcbn0pO1xyXG4iLCJhcHAuZmFjdG9yeSgnQ29tbWVudHNGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHApIHtcclxuICB2YXIgQ29tbWVudHNGYWN0b3J5ID0ge307XHJcbiAgdmFyIHBhZ2VDYWNoZSA9IHt9O1xyXG4gIENvbW1lbnRzRmFjdG9yeS5mZXRjaEFsbEZvclBhZ2UgPSBmdW5jdGlvbihpZCkge1xyXG4gICAgcmV0dXJuICRodHRwLmdldCgnYXBpL2NvbW1lbnRzL3BhZ2UvJyArIGlkKVxyXG4gICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xyXG4gICAgICBpZiAoIXBhZ2VDYWNoZVtpZF0pIHtcclxuICAgICAgICBwYWdlQ2FjaGVbaWRdID0gW107XHJcbiAgICAgIH1cclxuICAgICAgYW5ndWxhci5jb3B5KHJlc3BvbnNlLmRhdGEsIHBhZ2VDYWNoZVtpZF0pXHJcbiAgICAgIHJldHVybiBwYWdlQ2FjaGVbaWRdO1xyXG4gICAgfSlcclxuICB9O1xyXG5cclxuICBDb21tZW50c0ZhY3RvcnkuZmV0Y2hBbGxGb3JVc2VyID0gZnVuY3Rpb24oaWQpIHtcclxuICAgIHJldHVybiAkaHR0cC5nZXQoJ2FwaS9jb21tZW50cy91c2VyLycgKyBpZClcclxuICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcclxuICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGE7XHJcbiAgICB9KVxyXG4gIH07XHJcblxyXG4gIENvbW1lbnRzRmFjdG9yeS5wb3N0Q29tbWVudFRvQXJ0aWNsZSA9IGZ1bmN0aW9uKGlkLCB0ZXh0KXtcclxuICBcdHJldHVybiAkaHR0cC5wb3N0KCcvYXBpL2NvbW1lbnRzL3BhZ2UvJyArIGlkLCB7dGV4dDogdGV4dH0pXHJcbiAgXHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XHJcbiAgXHQgLy8gcGFnZUNhY2hlW2lkXS5jb21tZW50cy5wdXNoKHtcclxuICBcdCAvLyAgIHRleHQ6IHRleHQsXHJcbiAgXHQgLy8gICBkYXRlU3RhbXA6ICdQZW5kaW5nJyxcclxuICBcdCAvLyAgIHVzZXI6IHtcclxuICBcdCAvLyAgICAgZW1haWw6ICdQZW5kaW5nJ1xyXG4gIFx0IC8vICAgfVxyXG4gIFx0IC8vIH0pXHJcbiAgXHRcdHJldHVybiByZXNwb25zZS5kYXRhO1xyXG4gIFx0fSlcclxuICB9XHJcblxyXG4gIENvbW1lbnRzRmFjdG9yeS5yZW1vdmVDb21tZW50ID0gZnVuY3Rpb24oaWQpe1xyXG4gICAgcmV0dXJuICRodHRwLmRlbGV0ZSgnL2FwaS9jb21tZW50cy8nICsgaWQpXHJcbiAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XHJcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xyXG4gICAgfSlcclxuICB9XHJcblxyXG4gIENvbW1lbnRzRmFjdG9yeS5lZGl0Q29tbWVudCA9IGZ1bmN0aW9uKGlkLCB0ZXh0KXtcclxuICAgIHJldHVybiAkaHR0cC5wdXQoJy9hcGkvY29tbWVudHMvJyArIGlkLCB7dGV4dDogdGV4dH0pXHJcbiAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XHJcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xyXG4gICAgfSlcclxuICB9XHJcblxyXG4gIENvbW1lbnRzRmFjdG9yeS52b3RlID0gZnVuY3Rpb24oaWQsIGRpcmVjdGlvbil7XHJcbiAgICByZXR1cm4gJGh0dHAucHV0KCcvYXBpL2NvbW1lbnRzLycgKyBpZCArIGAvJHtkaXJlY3Rpb259dm90ZWApXHJcbiAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XHJcbiAgICAgIHJldHVybiByZXNwb25zZS5kYXRhO1xyXG4gICAgfSlcclxuICB9XHJcblxyXG4gIHJldHVybiBDb21tZW50c0ZhY3Rvcnk7XHJcbiAgXHJcbn0pXHJcbiIsImFwcC5jb250cm9sbGVyKCdhZGRBcnRpY2xlRm9ybUN0cmwnLCBmdW5jdGlvbiAoJG1kRGlhbG9nLCBBcnRpY2xlc0ZhY3RvcnksIENhdGVnb3JpZXNGYWN0b3J5LCBTZXNzaW9uLCBmb2xkZXJzLCBzdWJzY3JpcHRpb25zKSB7XHJcblxyXG5cdHRoaXMuZm9sZGVycyA9IGZvbGRlcnM7XHJcblx0dGhpcy5zdWJzY3JpcHRpb25zID0gc3Vic2NyaXB0aW9ucztcclxuXHJcblx0dGhpcy5jbG9zZSA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdCRtZERpYWxvZy5jYW5jZWwoKTtcclxuXHR9O1xyXG5cdHRoaXMuc3VibWl0ID0gZnVuY3Rpb24gKGRhdGEpIHtcclxuXHRcdFxyXG5cdFx0Y29uc29sZS5sb2coXCJTdWJtaXR0ZWQgQXJ0aWNsZSBEYXRhOiBcIiwgZGF0YSk7XHJcblxyXG5cdFx0dmFyIGNhdGVnb3J5SUQgPSBudWxsO1xyXG5cdFx0aWYoZGF0YS5zZWNvbmRhcnkpIGNhdGVnb3J5SUQgPSBkYXRhLnNlY29uZGFyeS5faWQ7XHJcblxyXG5cdFx0QXJ0aWNsZXNGYWN0b3J5LnBhcnNlVXJsKGRhdGEucHJpbWFyeSwgU2Vzc2lvbi51c2VyLl9pZCwgW2NhdGVnb3J5SURdKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbiAocmVzcG9uc2UpIHtcclxuXHRcdFx0XHQkbWREaWFsb2cuaGlkZSgpO1xyXG5cdFx0XHRcdC8vICRzY29wZS5wYXJzZWQgPSByZXNwb25zZTtcclxuXHRcdFx0fSk7XHJcblx0fVxyXG59KVxyXG4iLCJhcHAuY29udHJvbGxlcignYWRkQ2F0ZWdvcnlGb3JtQ3RybCcsIGZ1bmN0aW9uICgkbWREaWFsb2csIENhdGVnb3JpZXNGYWN0b3J5LCBTZXNzaW9uKSB7XHJcblxyXG5cclxuXHR0aGlzLmNsb3NlID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0JG1kRGlhbG9nLmNhbmNlbCgpO1xyXG5cdH07XHJcblx0dGhpcy5zdWJtaXQgPSBmdW5jdGlvbiAoZGF0YSkge1xyXG5cdFx0Ly8gaWYgdHlwZSBjYXRlZ29yeSwgc2VuZCB0byBjYXRlZ29yeSBhcGlcclxuXHRcdC8vIGlmIHR5cGUgdXJsLCBzZW5kIHRvIHVybCBhcGlcclxuXHJcblx0XHRpZighIWRhdGEucHVibGljKXtcclxuXHRcdFx0Q2F0ZWdvcmllc0ZhY3RvcnkuY3JlYXRlTmV3U3Vic2NyaXB0aW9uKGRhdGEubmFtZSlcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xyXG5cdFx0XHRcdGNvbnNvbGUubG9nKFwiU3VjY2Vzc2Z1bGx5IGNyZWF0ZWQgc3Vic2NyaXB0aW9uOlxcblwiLCByZXNwb25zZSk7XHJcblx0XHRcdFx0JG1kRGlhbG9nLmhpZGUoKTtcclxuXHRcdFx0fSlcclxuXHRcdH1lbHNle1xyXG5cdFx0XHRDYXRlZ29yaWVzRmFjdG9yeS5jcmVhdGVOZXdGb2xkZXIoZGF0YS5uYW1lKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XHJcblx0XHRcdFx0Y29uc29sZS5sb2coXCJTdWNjZXNzZnVsbHkgY3JlYXRlZCBmb2xkZXI6XFxuXCIsIHJlc3BvbnNlKTtcclxuXHRcdFx0XHQkbWREaWFsb2cuaGlkZSgpO1xyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cclxuXHR9XHJcblxyXG59KSIsImFwcC5jb250cm9sbGVyKCdmaWxlQXJ0aWNsZUZvcm1DdHJsJywgZnVuY3Rpb24gKCRtZERpYWxvZywgQ2F0ZWdvcmllc0ZhY3RvcnksIGZvbGRlcnMsIHN1YnNjcmlwdGlvbnMpIHtcclxuXHJcblx0dGhpcy5mb2xkZXJzID0gZm9sZGVycztcclxuXHR0aGlzLnN1YnNjcmlwdGlvbnMgPSBzdWJzY3JpcHRpb25zO1xyXG5cclxuXHR0aGlzLmNsb3NlID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0JG1kRGlhbG9nLmNhbmNlbCgpO1xyXG5cdH07XHJcblxyXG5cdHRoaXMuc3VibWl0ID0gZnVuY3Rpb24gKGFydGljbGVJZCwgY2F0ZWdvcnlEYXRhKSB7XHJcblxyXG5cdFx0Ly8gY29uc29sZS5sb2coXCJTdWJtaXR0ZWQgQXJ0aWNsZSBEYXRhOiBcIiwgYXJ0aWNsZUlkLCBjYXRlZ29yeURhdGEpO1xyXG5cdFx0XHJcblx0XHRpZihjYXRlZ29yeURhdGEudHlwZSA9PT0gJ3B1YmxpYycpe1xyXG5cdFx0XHRDYXRlZ29yaWVzRmFjdG9yeS5hZGRUb1N1YnNjcmlwdGlvbihjYXRlZ29yeURhdGEuX2lkLCBhcnRpY2xlSWQpXHJcblx0XHRcdC50aGVuKGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0JG1kRGlhbG9nLmhpZGUoKTtcclxuXHRcdFx0fSlcclxuXHRcdH1lbHNle1xyXG5cdFx0XHRDYXRlZ29yaWVzRmFjdG9yeS5hZGRUb0ZvbGRlcihjYXRlZ29yeURhdGEuX2lkLCBhcnRpY2xlSWQpLlxyXG5cdFx0XHR0aGVuKGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0JG1kRGlhbG9nLmhpZGUoKTtcclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHJcblx0fVxyXG59KVxyXG4iLCJhcHAuZGlyZWN0aXZlKCdhcnRpY2xlRGV0YWlsJywgZnVuY3Rpb24oKSB7XHJcbiAgcmV0dXJuIHtcclxuICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICBzY29wZToge1xyXG4gICAgXHRhcnRpY2xlOiAnPScsXHJcbiAgICAgIHJlbW92ZUl0ZW1Gcm9tRnVuY3Rpb246ICcmPydcclxuICAgIH0sXHJcbiAgICB0ZW1wbGF0ZVVybDogJ2FwcC9jb21tb24vZGlyZWN0aXZlcy9hcnRpY2xlRGV0YWlsQ2FyZC9kZXRhaWwuaHRtbCcsXHJcbiAgICBjb250cm9sbGVyOiAnQXJ0aWNsZURldGFpbEN0cmwnXHJcbiAgfVxyXG59KVxyXG5cclxuYXBwLmNvbnRyb2xsZXIoJ0FydGljbGVEZXRhaWxDdHJsJywgZnVuY3Rpb24oJHNjb3BlLCBBcnRpY2xlc0ZhY3RvcnkpIHtcclxuXHJcbiAgJHNjb3BlLmFkZFRvQ29sbGVjdGlvbiA9IGZ1bmN0aW9uKGFydGljbGUpIHtcclxuICAgIGlmIChhcnRpY2xlLmxpa2VkKSB7XHJcbiAgICAgIGFydGljbGUubGlrZWQgPSBmYWxzZTtcclxuICAgICAgQXJ0aWNsZXNGYWN0b3J5LnVuZmF2b3JpdGVBcnRpY2xlKGFydGljbGUuX2lkKVxyXG4gICAgICAgIC50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpXHJcbiAgICAgICAgfSlcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIGFydGljbGUubGlrZWQgPSB0cnVlO1xyXG4gICAgICBBcnRpY2xlc0ZhY3RvcnkuZmF2b3JpdGVBcnRpY2xlKGFydGljbGUpXHJcbiAgICAgIC50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhkYXRhKVxyXG4gICAgICB9KVxyXG4gICAgfVxyXG4gIH1cclxuIFxyXG4gIGlmKCEhJHNjb3BlLnJlbW92ZUl0ZW1Gcm9tRnVuY3Rpb24pe1xyXG4gICAgdmFyIHBhcnRpYWxGdW5jID0gJHNjb3BlLnJlbW92ZUl0ZW1Gcm9tRnVuY3Rpb24oKVxyXG4gICAgXHJcbiAgICAkc2NvcGUucmVtb3ZlSXRlbUZyb21IZXJlID0gZnVuY3Rpb24ocGFnZUlkKXtcclxuICAgICAgcGFydGlhbEZ1bmMocGFnZUlkKTtcclxuICAgIH1cclxuICB9XHJcblxyXG59KTtcclxuIiwiYXBwLmRpcmVjdGl2ZSgnYmluZENvbXBpbGVkSHRtbCcsIFsnJGNvbXBpbGUnLCBmdW5jdGlvbigkY29tcGlsZSkge1xyXG4gIHJldHVybiB7XHJcbiAgICB0ZW1wbGF0ZTogJzxkaXY+PC9kaXY+JyxcclxuICAgIHNjb3BlOiB7XHJcbiAgICAgIHJhd0h0bWw6ICc9YmluZENvbXBpbGVkSHRtbCdcclxuICAgIH0sXHJcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbSkge1xyXG4gICAgICB2YXIgaW1ncyA9IFtdO1xyXG4gICAgICBzY29wZS4kd2F0Y2goJ3Jhd0h0bWwnLCBmdW5jdGlvbih2YWx1ZSkge1xyXG4gICAgICAgIGlmICghdmFsdWUpIHJldHVybjtcclxuICAgICAgICB2YXIgbmV3RWxlbSA9ICRjb21waWxlKHZhbHVlKShzY29wZS4kcGFyZW50KTtcclxuICAgICAgICBlbGVtLmNvbnRlbnRzKCkucmVtb3ZlKCk7XHJcbiAgICAgICAgbmV3RWxlbS5maW5kKCdpbWcnKS5hZGRDbGFzcygnaW1nLXJlc3BvbnNpdmUnKTtcclxuICAgICAgICBlbGVtLmFwcGVuZChuZXdFbGVtKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfTtcclxufV0pO1xyXG4iLCJhcHAuZGlyZWN0aXZlKCdmdWxsc3RhY2tMb2dvJywgZnVuY3Rpb24gKCkge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICByZXN0cmljdDogJ0UnLFxyXG4gICAgICAgIHRlbXBsYXRlVXJsOiAnYXBwL2NvbW1vbi9kaXJlY3RpdmVzL2Z1bGxzdGFjay1sb2dvL2Z1bGxzdGFjay1sb2dvLmh0bWwnXHJcbiAgICB9O1xyXG59KTsiLCJhcHAuZGlyZWN0aXZlKCduYXZiYXInLCBmdW5jdGlvbiAoJHJvb3RTY29wZSwgQXV0aFNlcnZpY2UsIEFVVEhfRVZFTlRTLCAkc3RhdGUsICRtZFNpZGVuYXYsICRtZElua1JpcHBsZSkge1xyXG5cclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgcmVzdHJpY3Q6ICdFJyxcclxuICAgICAgICBzY29wZToge30sXHJcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvY29tbW9uL2RpcmVjdGl2ZXMvbmF2YmFyL25hdmJhci5odG1sJyxcclxuICAgICAgICBsaW5rOiBmdW5jdGlvbiAoc2NvcGUsIGVsZW1lbnQpIHtcclxuXHJcbiAgICAgICAgICAgIHNjb3BlLnRvZ2dsZSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgICAgJG1kU2lkZW5hdihcImxlZnRcIikudG9nZ2xlKCk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBzY29wZS5pdGVtcyA9IFtcclxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdIb21lJywgc3RhdGU6ICdob21lJyB9LFxyXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ1BhcnNlcicsIHN0YXRlOiAncGFyc2VyJyB9LFxyXG4gICAgICAgICAgICAgICAgeyBsYWJlbDogJ1BhZ2VzJywgc3RhdGU6ICdwYWdlcycgfSxcclxuICAgICAgICAgICAgICAgIHsgbGFiZWw6ICdNZW1iZXJzIE9ubHknLCBzdGF0ZTogJ21lbWJlcnNPbmx5JywgYXV0aDogdHJ1ZSB9XHJcbiAgICAgICAgICAgIF07XHJcblxyXG4gICAgICAgICAgICBzY29wZS51c2VyID0gbnVsbDtcclxuXHJcbiAgICAgICAgICAgIHNjb3BlLmlzTG9nZ2VkSW4gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gQXV0aFNlcnZpY2UuaXNBdXRoZW50aWNhdGVkKCk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICBzY29wZS5sb2dvdXQgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICBBdXRoU2VydmljZS5sb2dvdXQoKS50aGVuKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnbG9naW4nKTtcclxuICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9nZ2VkSW5Vc2VyID0gbnVsbDtcclxuICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgc2NvcGUucmVmcmVzaCA9IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdSZWxvYWRpbmcgVUkgc3RhdGVzLi4uJylcclxuICAgICAgICAgICAgICAkc3RhdGUucmVsb2FkKCk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHZhciBzZXRVc2VyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgQXV0aFNlcnZpY2UuZ2V0TG9nZ2VkSW5Vc2VyKCkudGhlbihmdW5jdGlvbiAodXNlcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSB1c2VyO1xyXG4gICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICB2YXIgcmVtb3ZlVXNlciA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgIHNjb3BlLnVzZXIgPSBudWxsO1xyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgc2V0VXNlcigpO1xyXG5cclxuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9naW5TdWNjZXNzLCBzZXRVc2VyKTtcclxuICAgICAgICAgICAgJHJvb3RTY29wZS4kb24oQVVUSF9FVkVOVFMubG9nb3V0U3VjY2VzcywgcmVtb3ZlVXNlcik7XHJcbiAgICAgICAgICAgICRyb290U2NvcGUuJG9uKEFVVEhfRVZFTlRTLnNlc3Npb25UaW1lb3V0LCByZW1vdmVVc2VyKTtcclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgIH07XHJcblxyXG59KTtcclxuIiwiYXBwLmRpcmVjdGl2ZSgncmFuZG9HcmVldGluZycsIGZ1bmN0aW9uIChSYW5kb21HcmVldGluZ3MpIHtcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHJlc3RyaWN0OiAnRScsXHJcbiAgICAgICAgdGVtcGxhdGVVcmw6ICdhcHAvY29tbW9uL2RpcmVjdGl2ZXMvcmFuZG8tZ3JlZXRpbmcvcmFuZG8tZ3JlZXRpbmcuaHRtbCcsXHJcbiAgICAgICAgbGluazogZnVuY3Rpb24gKHNjb3BlKSB7XHJcbiAgICAgICAgICAgIHNjb3BlLmdyZWV0aW5nID0gUmFuZG9tR3JlZXRpbmdzLmdldFJhbmRvbUdyZWV0aW5nKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfTtcclxuXHJcbn0pOyIsImFwcC5kaXJlY3RpdmUoJ3NlY3Rpb25zVmlldycsIGZ1bmN0aW9uIChDYXRlZ29yaWVzRmFjdG9yeSkge1xyXG5cdHJldHVybiB7XHJcblx0XHRyZXN0cmljdDogJ0UnLFxyXG5cdFx0c2NvcGU6IHsgY2F0ZWdvcmllczogJz0nLCByZW1vdmVGcm9tRnVuY3Rpb246ICcmPyd9LFxyXG5cdFx0dGVtcGxhdGVVcmw6ICdhcHAvY29tbW9uL2RpcmVjdGl2ZXMvc2VjdGlvbnMvc2VjdGlvbnMtdmlldy5odG1sJyxcclxuXHJcblx0XHRsaW5rOiBmdW5jdGlvbihzY29wZSkge1xyXG5cdFx0XHRzY29wZS5tZW51VXAgPSBmdW5jdGlvbihjYXRlZ29yeSl7XHJcblx0XHRcdFx0Y2F0ZWdvcnkgPSBjYXRlZ29yeS50b0xvd2VyQ2FzZSgpO1xyXG5cdFx0XHRcdHZhciBtZW51VXBJZCA9ICcjJyArIGNhdGVnb3J5ICsgJy1tZW51LXVwJ1xyXG5cdFx0XHRcdHZhciBsaXN0SWQgPSAnIycgKyBjYXRlZ29yeTtcclxuXHRcdFx0XHRpZigkKG1lbnVVcElkKS5jc3MoJ3RyYW5zZm9ybScpXHQhPT0gJ25vbmUnKXtcclxuXHRcdFx0XHRcdCQobWVudVVwSWQpLmNzcyhcInRyYW5zZm9ybVwiLCBcIlwiKTtcclxuXHRcdFx0XHRcdCQobGlzdElkKS5zaG93KDQwMCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdGVsc2V7XHJcblx0XHRcdFx0XHQkKG1lbnVVcElkKS5jc3MoXCJ0cmFuc2Zvcm1cIiwgXCJyb3RhdGUoMTgwZGVnKVwiKTtcclxuXHRcdFx0XHRcdCQobGlzdElkKS5oaWRlKDQwMCk7XHRcdFx0XHRcclxuXHRcdFx0XHR9XHRcdFxyXG5cdFx0XHR9O1xyXG5cdFx0XHRcclxuXHRcdFx0aWYoISFzY29wZS5yZW1vdmVGcm9tRnVuY3Rpb24pe1xyXG5cdFx0XHRcdHNjb3BlLnBhc3MgPSB0cnVlO1xyXG5cdFx0XHRcdHNjb3BlLnJlbW92ZUl0ZW1Gcm9tU2VjdGlvbiA9IGZ1bmN0aW9uKGNhdGVnb3J5SWQpe1xyXG5cclxuXHRcdFx0XHRcdHJldHVybiBmdW5jdGlvbiByZW1vdmVQYWdlRnJvbVNlY3Rpb24ocGFnZUlkKXtcclxuXHRcdFx0XHRcdFx0Ly8gY29uc29sZS5sb2coXCJJbm5lciBGdW5jdGlvbiB3aXRoIENhdGVnb3J5OiBcIiwgY2F0ZWdvcnlJZCwgXCIgJiBQYWdlOiBcIiwgcGFnZUlkKTtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIHNjb3BlLnJlbW92ZUZyb21GdW5jdGlvbih7Y2F0ZWdvcnlJZDogY2F0ZWdvcnlJZCwgcGFnZUlkOiBwYWdlSWR9KTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblx0XHRcdH1lbHNle1xyXG5cdFx0XHRcdHNjb3BlLnBhc3MgPSBmYWxzZTtcclxuXHRcdFx0fVxyXG5cdFx0XHRcclxuXHRcdH1cclxuXHR9XHJcbn0pXHJcbiIsImFwcC5kaXJlY3RpdmUoJ3NpZGViYXInLCBmdW5jdGlvbiAoQ2F0ZWdvcmllc0ZhY3RvcnkpIHtcclxuXHRyZXR1cm4ge1xyXG5cdFx0cmVzdHJpY3Q6ICdFJyxcclxuXHRcdHNjb3BlOiB7fSxcclxuXHRcdHRlbXBsYXRlVXJsOiAnYXBwL2NvbW1vbi9kaXJlY3RpdmVzL3NpZGViYXIvc2lkZWJhci5odG1sJyxcclxuXHJcblx0XHRsaW5rOiBmdW5jdGlvbihzY29wZSkge1xyXG5cclxuXHRcdFx0Q2F0ZWdvcmllc0ZhY3RvcnkuZ2V0VXNlckZvbGRlcnMoKVxyXG5cdFx0XHQudGhlbihmdW5jdGlvbihmb2xkZXJzKXtcclxuXHRcdFx0XHRzY29wZS5mb2xkZXJzID0gZm9sZGVycztcclxuXHRcdFx0fSlcclxuXHJcblx0XHRcdENhdGVnb3JpZXNGYWN0b3J5LmdldFVzZXJTdWJzY3JpcHRpb25zKClcclxuXHRcdFx0LnRoZW4oZnVuY3Rpb24oc3Vic2NyaXB0aW9ucyl7XHJcblx0XHRcdFx0c2NvcGUuc3Vic2NyaXB0aW9ucyA9IHN1YnNjcmlwdGlvbnM7XHJcblx0XHRcdH0pXHJcblxyXG5cdFx0XHRzY29wZS5yZW1vdmVGb2xkZXIgPSBmdW5jdGlvbihpZCl7XHJcblx0XHRcdFx0Q2F0ZWdvcmllc0ZhY3RvcnkucmVtb3ZlRm9sZGVyKGlkKVxyXG5cdFx0XHRcdC50aGVuKGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0XHR2YXIgaW5kZXggPSBzY29wZS5mb2xkZXJzLm1hcChmdW5jdGlvbihlbGVtZW50KXsgXHJcblx0XHRcdFx0XHRcdHJldHVybiBlbGVtZW50Ll9pZDtcclxuXHRcdFx0XHRcdH0pLmluZGV4T2YoaWQpO1xyXG5cclxuXHRcdFx0XHRcdHNjb3BlLmZvbGRlcnMuc3BsaWNlKGluZGV4LCAxKTtcclxuXHRcdFx0XHR9KVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRzY29wZS5yZW1vdmVTdWJzY3JpcHRpb24gPSBmdW5jdGlvbihpZCl7XHJcblx0XHRcdFx0Q2F0ZWdvcmllc0ZhY3RvcnkucmVtb3ZlU3Vic2NyaXB0aW9uKGlkKVxyXG5cdFx0XHRcdC50aGVuKGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0XHR2YXIgaW5kZXggPSBzY29wZS5zdWJzY3JpcHRpb25zLm1hcChmdW5jdGlvbihlbGVtZW50KXsgXHJcblx0XHRcdFx0XHRcdHJldHVybiBlbGVtZW50Ll9pZDtcclxuXHRcdFx0XHRcdH0pLmluZGV4T2YoaWQpO1xyXG5cdFx0XHRcdFx0XHJcblx0XHRcdFx0XHRzY29wZS5zdWJzY3JpcHRpb25zLnNwbGljZShpbmRleCwgMSk7XHJcblx0XHRcdFx0fSlcclxuXHRcdFx0fVxyXG5cclxuXHRcdCAgICAkKFwiLm1lbnUtdXBcIikuY2xpY2soZnVuY3Rpb24oKXtcclxuXHRcdCAgICBcdGlmKCQodGhpcykuY3NzKCd0cmFuc2Zvcm0nKVx0IT09ICdub25lJyl7XHJcblx0XHQgICAgXHRcdCQodGhpcykuY3NzKFwidHJhbnNmb3JtXCIsIFwiXCIpO1xyXG5cdFx0ICAgIFx0XHRpZigkKHRoaXMpLmF0dHIoJ2lkJykgPT09ICdzdWJzY3JpcHRpb25zLWljb24nKVxyXG5cdFx0ICAgIFx0XHRcdCQoJyNzdWJzY3JpcHRpb25zJykuc2hvdyg0MDApO1xyXG5cdFx0ICAgIFx0XHRpZigkKHRoaXMpLmF0dHIoJ2lkJykgPT09ICdmb2xkZXJzLWljb24nKVxyXG5cdFx0ICAgIFx0XHRcdCQoJyNmb2xkZXJzJykuc2hvdyg0MDApO1xyXG5cdFx0ICAgIFx0fVxyXG5cdFx0ICAgIFx0ZWxzZXtcclxuXHRcdFx0XHRcdCQodGhpcykuY3NzKFwidHJhbnNmb3JtXCIsIFwicm90YXRlKDE4MGRlZylcIik7XHJcblx0XHQgICAgXHRcdGlmKCQodGhpcykuYXR0cignaWQnKSA9PT0gJ3N1YnNjcmlwdGlvbnMtaWNvbicpXHJcblx0XHQgICAgXHRcdFx0JCgnI3N1YnNjcmlwdGlvbnMnKS5oaWRlKDQwMCk7XHJcblx0XHQgICAgXHRcdGlmKCQodGhpcykuYXR0cignaWQnKSA9PT0gJ2ZvbGRlcnMtaWNvbicpXHJcblx0XHQgICAgXHRcdFx0JCgnI2ZvbGRlcnMnKS5oaWRlKDQwMCk7XHRcdFx0XHRcclxuXHRcdCAgICBcdH1cclxuXHRcdFx0fSk7XHJcblxyXG5cdFx0fVxyXG5cdH1cclxufSlcclxuIiwiYXBwLmRpcmVjdGl2ZSgnc3BlZWREaWFsJywgZnVuY3Rpb24gKCRtZERpYWxvZywgJHN0YXRlLCAkcm9vdFNjb3BlLCBDYXRlZ29yaWVzRmFjdG9yeSwgQXJ0aWNsZXNGYWN0b3J5KSB7XHJcblx0cmV0dXJuIHtcclxuXHRcdHJlc3RyaWN0OiAnRScsXHJcblx0XHRzY29wZToge30sXHJcblx0XHR0ZW1wbGF0ZVVybDogJy9hcHAvY29tbW9uL2RpcmVjdGl2ZXMvc3BlZWQtZGlhbC9zcGVlZC1kaWFsLmh0bWwnLFxyXG5cdFx0bGluazogZnVuY3Rpb24gKHNjb3BlLCBlbGVtZW50LCBhdHRyaWJ1dGUpIHtcclxuXHJcblx0XHRcdHNjb3BlLiRyb290LiRvbignJHN0YXRlQ2hhbmdlU3VjY2VzcycsIGZ1bmN0aW9uKGV2ZW50LCB0b1N0YXRlLCB0b1BhcmFtcywgZnJvbVN0YXRlLCBmcm9tUGFyYW1zKXtcclxuXHRcdFx0XHR2YXIgb3B0aW9uc0J5U3RhdGUgPSB7XHJcblx0XHRcdFx0XHRkZWZhdWx0OiB7XHJcblx0XHRcdFx0XHRcdGlzT3BlbjogZmFsc2UsXHJcblx0XHRcdFx0XHRcdGNvdW50OiAwLFxyXG5cdFx0XHRcdFx0XHRoaWRkZW46IGZhbHNlLFxyXG5cdFx0XHRcdFx0XHRob3ZlcjogZmFsc2UsXHJcblx0XHRcdFx0XHRcdGl0ZW1zOiBbXHJcblx0XHRcdFx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0XHRcdFx0bmFtZTogXCJBZGQgVVJMXCIsXHJcblx0XHRcdFx0XHRcdFx0XHRpY29uOiBcIi9hc3NldHMvaWNvbnMvaWNfYWRkX3doaXRlXzM2cHguc3ZnXCIsXHJcblx0XHRcdFx0XHRcdFx0XHRkaXJlY3Rpb246IFwidG9wXCIsXHJcblx0XHRcdFx0XHRcdFx0XHRhY3Rpb246ICdvcGVuRGlhbG9nJywgXHJcblx0XHRcdFx0XHRcdFx0XHRjb250cm9sbGVyOiAnYWRkQXJ0aWNsZUZvcm1DdHJsJyxcclxuXHRcdFx0XHRcdFx0XHRcdGNvbnRyb2xsZXJBczogJ2RpYWxvZycsXHJcblx0XHRcdFx0XHRcdFx0XHR0ZW1wbGF0ZVVybDogJy9hcHAvY29tbW9uL2RpYWxvZ3MvYXJ0aWNsZS1kaWFsb2cvYXJ0aWNsZS1kaWFsb2cuaHRtbCcsXHJcblx0XHRcdFx0XHRcdFx0XHRyZXNvbHZlOiB7XHJcblx0XHRcdFx0XHRcdFx0XHRcdGZvbGRlcnM6IGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIENhdGVnb3JpZXNGYWN0b3J5LmdldFVzZXJGb2xkZXJzKCk7XHJcblx0XHRcdFx0XHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRcdFx0XHRcdHN1YnNjcmlwdGlvbnM6IGZ1bmN0aW9uKCl7XHJcblx0XHRcdFx0XHRcdFx0XHRcdFx0cmV0dXJuIENhdGVnb3JpZXNGYWN0b3J5LmdldFVzZXJTdWJzY3JpcHRpb25zKCk7XHJcblx0XHRcdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0XHRcdHtcclxuXHRcdFx0XHRcdFx0XHRcdG5hbWU6IFwiTmV3IEZvbGRlciAvIFN1YnNjcmlwdGlvblwiLFxyXG5cdFx0XHRcdFx0XHRcdFx0aWNvbjogXCIvYXNzZXRzL2ljb25zL2ljX3BsYXlsaXN0X2FkZF93aGl0ZV8zNnB4LnN2Z1wiLFxyXG5cdFx0XHRcdFx0XHRcdFx0ZGlyZWN0aW9uOiBcImJvdHRvbVwiLFxyXG5cdFx0XHRcdFx0XHRcdFx0YWN0aW9uOiAnb3BlbkRpYWxvZycsXHJcblx0XHRcdFx0XHRcdFx0XHRjb250cm9sbGVyOiBcImFkZENhdGVnb3J5Rm9ybUN0cmxcIixcclxuXHRcdFx0XHRcdFx0XHRcdGNvbnRyb2xsZXJBczogJ2RpYWxvZycsXHJcblx0XHRcdFx0XHRcdFx0XHR0ZW1wbGF0ZVVybDogJy9hcHAvY29tbW9uL2RpYWxvZ3MvY2F0ZWdvcnktZGlhbG9nL2NhdGVnb3J5LWRpYWxvZy5odG1sJ1xyXG5cdFx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdFx0XSxcclxuXHRcdFx0XHRcdFx0dGFrZUFjdGlvbjogZnVuY3Rpb24oJGV2ZW50LCBpdGVtKXtcclxuXHRcdFx0XHRcdFx0XHRhY3QoJGV2ZW50LCBpdGVtLCB0aGlzKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fSxcclxuXHJcblx0XHRcdFx0XHRhcnRpY2xlOiB7XHJcblx0XHRcdFx0XHRcdGlzT3BlbjogZmFsc2UsXHJcblx0XHRcdFx0XHRcdGNvdW50OiAwLFxyXG5cdFx0XHRcdFx0XHRoaWRkZW46IGZhbHNlLFxyXG5cdFx0XHRcdFx0XHRob3ZlcjogZmFsc2UsXHJcblx0XHRcdFx0XHRcdGl0ZW1zOiBbXHJcblx0XHRcdFx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0XHRcdFx0bmFtZTogXCJKdW1wIHRvIERpc2N1c3Npb25cIixcclxuXHRcdFx0XHRcdFx0XHRcdGljb246IFwiL2Fzc2V0cy9pY29ucy9pY19jaGF0XzQ4cHguc3ZnXCIsXHJcblx0XHRcdFx0XHRcdFx0XHRkaXJlY3Rpb246IFwidG9wXCIsXHJcblx0XHRcdFx0XHRcdFx0XHRhY3Rpb246ICdvcGVuTGluaycsXHJcblx0XHRcdFx0XHRcdFx0XHRnb3RvOiBcInBhZ2VDb21tZW50c1wiLFxyXG5cdFx0XHRcdFx0XHRcdFx0ZGF0YToge2lkOiB0b1BhcmFtcy5pZH1cclxuXHRcdFx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0XHRcdHtcclxuXHRcdFx0XHRcdFx0XHRcdG5hbWU6IFwiQWRkIHRvIENvbGxlY3Rpb25zXCIsXHJcblx0XHRcdFx0XHRcdFx0XHRpY29uOiAnL2Fzc2V0cy9pY29ucy9pY19mYXZvcml0ZV93aGl0ZV80OHB4LnN2ZycsXHJcblx0XHRcdFx0XHRcdFx0XHRkaXJlY3Rpb246IFwiYm90dG9tXCIsXHJcblx0XHRcdFx0XHRcdFx0XHRhY3Rpb246ICdhZGRGYXZvcml0ZScsXHJcblx0XHRcdFx0XHRcdFx0XHRkYXRhOiB7aWQ6IHRvUGFyYW1zLmlkfVxyXG5cdFx0XHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRcdFx0e1xyXG5cdFx0XHRcdFx0XHRcdFx0bmFtZTogXCJBZGQgdG8gRm9sZGVyIC8gU3Vic2NyaXB0aW9uXCIsXHJcblx0XHRcdFx0XHRcdFx0XHRpY29uOiAnL2Fzc2V0cy9pY29ucy9pY19wbGF5bGlzdF9hZGRfd2hpdGVfMzZweC5zdmcnLFxyXG5cdFx0XHRcdFx0XHRcdFx0ZGlyZWN0aW9uOiBcInRvcFwiLFxyXG5cdFx0XHRcdFx0XHRcdFx0YWN0aW9uOiAnb3BlbkRpYWxvZycsXHJcblx0XHRcdFx0XHRcdFx0XHRjb250cm9sbGVyOiAnZmlsZUFydGljbGVGb3JtQ3RybCcsXHJcblx0XHRcdFx0XHRcdFx0XHRjb250cm9sbGVyQXM6ICdkaWFsb2cnLFxyXG5cdFx0XHRcdFx0XHRcdFx0dGVtcGxhdGVVcmw6ICcvYXBwL2NvbW1vbi9kaWFsb2dzL2ZpbGluZy1kaWFsb2cvZmlsaW5nLWRpYWxvZy5odG1sJyxcclxuXHRcdFx0XHRcdFx0XHRcdHJlc29sdmU6IHtcclxuXHRcdFx0XHRcdFx0XHRcdFx0Zm9sZGVyczogZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gQ2F0ZWdvcmllc0ZhY3RvcnkuZ2V0VXNlckZvbGRlcnMoKTtcclxuXHRcdFx0XHRcdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdFx0XHRcdFx0c3Vic2NyaXB0aW9uczogZnVuY3Rpb24oKXtcclxuXHRcdFx0XHRcdFx0XHRcdFx0XHRyZXR1cm4gQ2F0ZWdvcmllc0ZhY3RvcnkuZ2V0VXNlclN1YnNjcmlwdGlvbnMoKTtcclxuXHRcdFx0XHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0XHRcdFx0fSxcclxuXHRcdFx0XHRcdFx0XHRcdGRhdGE6IHtpZDogdG9QYXJhbXMuaWR9XHJcblx0XHRcdFx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRcdFx0XSxcclxuXHRcdFx0XHRcdFx0dGFrZUFjdGlvbjogZnVuY3Rpb24oJGV2ZW50LCBpdGVtKXtcclxuXHRcdFx0XHRcdFx0XHRhY3QoJGV2ZW50LCBpdGVtLCB0aGlzKTtcclxuXHRcdFx0XHRcdFx0fVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0gLy9FbmQgb3B0aW9uc0J5U3RhdGVcclxuXHJcblx0XHRcdFx0aWYob3B0aW9uc0J5U3RhdGVbdG9TdGF0ZS5uYW1lXSl7XHJcblx0XHRcdFx0XHRmb3IodmFyIGtleSBpbiBvcHRpb25zQnlTdGF0ZVt0b1N0YXRlLm5hbWVdKXtcclxuXHRcdFx0XHRcdFx0c2NvcGVba2V5XSA9IG9wdGlvbnNCeVN0YXRlW3RvU3RhdGUubmFtZV1ba2V5XTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9ZWxzZXtcclxuXHRcdFx0XHRcdGZvcih2YXIga2V5IGluIG9wdGlvbnNCeVN0YXRlW1wiZGVmYXVsdFwiXSl7XHJcblx0XHRcdFx0XHRcdHNjb3BlW2tleV0gPSBvcHRpb25zQnlTdGF0ZVtcImRlZmF1bHRcIl1ba2V5XTtcclxuXHRcdFx0XHRcdH1cclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHR9KTsgLy9FbmQgJG9uIHN0YXRlQ2hhbmdlU3VjY2Vzc1xyXG5cclxuXHRcdFx0Ly9BY3Rpb25zXHJcblx0XHRcdGZ1bmN0aW9uIGFjdCgkZXZlbnQsIGl0ZW0sIGNvbnRleHQpe1xyXG5cdFx0XHRcdGlmKGl0ZW0uYWN0aW9uID09PSAnb3BlbkRpYWxvZycpe1xyXG5cdFx0XHRcdFx0JG1kRGlhbG9nLnNob3coe1xyXG5cdFx0XHRcdFx0XHRzY29wZTogY29udGV4dCxcclxuXHRcdFx0XHRcdFx0cHJlc2VydmVTY29wZTogdHJ1ZSxcclxuXHRcdFx0XHRcdFx0Y2xpY2tPdXRzaWRlVG9DbG9zZTogdHJ1ZSxcclxuXHRcdFx0XHRcdFx0Y29udHJvbGxlcjogaXRlbS5jb250cm9sbGVyLFxyXG5cdFx0XHRcdFx0XHRjb250cm9sbGVyQXM6IGl0ZW0uY29udHJvbGxlckFzLFxyXG5cdFx0XHRcdFx0XHR0ZW1wbGF0ZVVybDogaXRlbS50ZW1wbGF0ZVVybCxcclxuXHRcdFx0XHRcdFx0dGFyZ2V0RXZlbnQ6ICRldmVudCxcclxuXHRcdFx0XHRcdFx0bG9jYWxzOiB7XHJcblx0XHRcdFx0XHRcdFx0aXRlbTogaXRlbVxyXG5cdFx0XHRcdFx0XHR9LFxyXG5cdFx0XHRcdFx0XHRyZXNvbHZlOiBpdGVtLnJlc29sdmVcclxuXHRcdFx0XHRcdFx0XHJcblx0XHRcdFx0XHR9KVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0XHRcclxuXHRcdFx0XHRpZihpdGVtLmFjdGlvbiA9PT0gJ29wZW5MaW5rJyl7XHJcblx0XHRcdFx0XHQkc3RhdGUuZ28oaXRlbS5nb3RvLCBpdGVtLmRhdGEpO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0aWYoaXRlbS5hY3Rpb24gPT09ICdhZGRGYXZvcml0ZScpe1xyXG5cdFx0XHRcdFx0QXJ0aWNsZXNGYWN0b3J5LmZhdm9yaXRlQXJ0aWNsZShpdGVtLmRhdGEuaWQpO1xyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdH0gLy9FbmQgbGlua1xyXG5cdH1cclxufSlcclxuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
