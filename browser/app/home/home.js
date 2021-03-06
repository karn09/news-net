app.config(function ($stateProvider, $urlRouterProvider) {
	$stateProvider.state('home', {
		url: '/home',
		templateUrl: 'app/home/home.html',
		resolve: {
			user: function (AuthService) {
				return AuthService.getLoggedInUser();
			},
			// recommendedArticles: function (ArticlesFactory) {
			// 	return ArticlesFactory.fetchRecommendedArticles();
			// },
    		articles: function(ArticlesFactory) {
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
		var it, results = [];
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
