app.factory('ArticlesFactory', function ($http) {
	var ArticlesFactory = {};
	var allArticlesCache = [];
	var userArticlesCache = [];
	var userArticlesArray = [];

	ArticlesFactory.fetchAll = function () {
		return $http.get("/api/pages")
			.then(function (response) {
				if (allArticlesCache !== response.data) {
					angular.copy(response.data, allArticlesCache);
				}
				return allArticlesCache;
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
			.catch(function (err) {
				console.log('No response from server.. serving from object cache: ', err);
				var foundArticle = _.find(allArticlesCache, function (article) {
					return article._id === id
				});
				console.log(foundArticle);
				return foundArticle
			})
	};


	ArticlesFactory.addArticleToCategory = function (url, category) {
		// add one article to category
	};



	ArticlesFactory.saveArticleByUrl = function (url, category) {
		// default to all, or optional category
	}

	//Methods for current (logged in user)
	ArticlesFactory.fetchUserArticlesArray = function () {
		return $http.get('api/pages/user/me')
			.then(function (response) {
				if (response.data !== userArticlesArray) {
					angular.copy(response.data, userArticlesArray);
				}
				return userArticlesArray;
			})
	}

	ArticlesFactory.fetchUserArticlesPopulated = function () {
		return $http.get('api/users/me')
			.then(function (response) {
				angular.copy(response.data.pages, userArticlesCache)
				return userArticlesCache
			})
			.catch(function(err) {
				console.log('No internet connection, returning stale data..')
				return userArticlesCache;
			})
	}

	// TODO: sync when back online...
	ArticlesFactory.favoriteArticle = function (id) {
		return $http.put('api/pages/' + id + '/favorite')
			.then(function (response) {
				console.log(response.data)
				return response.data;
			})
	}
	// TODO: sync when back online...
	ArticlesFactory.unfavoriteArticle = function (id) {
		return $http.put('api/pages/' + id + '/unfavorite')
			.then(function (response) {
				_.remove(userArticlesCache, function (article) {
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

	ArticlesFactory.parseUrl = function (url, userid, categories) {
		//1. parse the Url
		//2. post to pages
		//3. add page to user's list
		//4. add page to categories

		var encoded = encodeURIComponent(url);
		return $http.get("/api/parser/" + encoded)
			.then(function (result) {
				//console.log("userid: ", userid);
				return $http.post("/api/pages", result.data)
					.then(function (pageResponse) {
						//console.log("page parsed: ", pageResponse.data);
						return $http.put("/api/users/addPage/" + userid, {
								page: pageResponse.data._id
							})
							.then(function (res) {
								if (categories) {
									var toUpdate = [];
									for (var i = 0; i < categories.length; i++) {
										//console.log("adding page to category: ", categories[i]);
										toUpdate.push($http.put("/api/categories/addPage/" + categories[i], {
											page: pageResponse.data._id
										}));
									}
									console.log("toUpdate: ", toUpdate);
									return Promise.all(toUpdate)
										.then(function (response) {
											console.log("all categories updated");
											if (!checkPageCacheContains(pageResponse.data._id)) {
												console.log('Not found, add to cache');
												pageResponse.data.liked = true;
												userArticlesCache.push(pageResponse.data);
											}
											return pageResponse.data;
										})
								} else {
									// userArticlesCache.push()
									console.log('New page added: ', pageResponse.data)
									if (!checkPageCacheContains(pageResponse.data._id)) {
										console.log('Not found, add to cache');
										pageResponse.data.liked = true;
										userArticlesCache.push(pageResponse.data);
									}
									return pageResponse.data;
								}
							})
					})
			});
	};

	function checkPageCacheContains(id) {
		return _.contains(userArticlesCache, function (article) {
			return article._id === id;
		});
	};

	return ArticlesFactory;
})
