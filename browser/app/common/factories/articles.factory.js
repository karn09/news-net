app.factory('ArticlesFactory', function ($http) {
	var ArticlesFactory = {};
  var allArticlesCache = [];
	var userArticlesCache = [];

	ArticlesFactory.fetchAll = function () {
		return $http.get("/api/pages")
			.then(function (response) {
				return response.data;
			})
	}

	//Can either provide name or id as parameter (i.e. obj = {name: "Technology"})
	ArticlesFactory.fetchAllByCategory = function (obj) {
		var urlString = "/api/pages/category?"
		for (var key in obj) {
			var queryParameter = key + "=" + obj[key];
			urlString += queryParameter;
		}

		return $http.get(urlString)
			.then(function (response) {
				return response.data;
			})
	};

	ArticlesFactory.fetchCategories = function () {
		return $http.get("/api/categories/")
			.then(function (response) {
        console.log('factory data, ', response.data)
				return response.data;
			})
			.catch(function (err) {
				console.log("No connection: ", err);
			});

	}

	ArticlesFactory.fetchArticleById = function (id) {
		return $http.get("/api/pages/" + id)
			.then(function (response) {
				return response.data;
			})
	};


	ArticlesFactory.addArticleToCategory = function (url, category) {
		// add one article to category
	};



	ArticlesFactory.saveArticleByUrl = function (url, category) {
		// default to all, or optional category
	}

	//Methods for current (logged in user)
	ArticlesFactory.fetchUserArticlesArray = function(){
		return $http.get('api/pages/user/me')
		.then(function(response){
			console.log(response.data)
			return response.data;
		})
	}

	ArticlesFactory.fetchUserArticlesPopulated = function(){
		return $http.get('api/users/me')
		.then(function(response){
			angular.copy(response.data.pages, userArticlesCache)
			return userArticlesCache
		})
	}

	ArticlesFactory.favoriteArticle = function(id){
		return $http.put('api/pages/' + id + '/favorite')
		.then(function(response){
			console.log(response.data)
			return response.data;
		})
	}

	ArticlesFactory.unfavoriteArticle = function(id){
		return $http.put('api/pages/' + id + '/unfavorite')
		.then(function(response){
			_.remove(userArticlesCache, function(article) {
				return id === article._id
			})
			console.log('unfav: ', userArticlesCache)
			return response.data;
		})
	}

	//Remove article from user's list, not delete.
	// ArticlesFactory.removeArticleByID = function (id) {
	// 	return $http.put('/users/removePage/' + id)
	// 		.then(function (response) {
	// 			return response.data;
	// 		})
	// };

	return ArticlesFactory;
})
