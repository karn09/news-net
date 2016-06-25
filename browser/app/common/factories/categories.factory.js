app.factory('CategoriesFactory', function ($http) {
	var CategoriesFactory = {};
	var currentSubscriptions = [];
	var currentSubscriptionsDetailed = [];
	var userFolders = [];

	CategoriesFactory.getUserSubscriptions = function(){
		return $http.get('/api/subscriptions/user/me')
		.then(function(response){
			if (response.data !== currentSubscriptions) {
				console.log('User subscriptions retrieved: ', response.data);
				angular.copy(response.data, currentSubscriptions);
			}
		  return currentSubscriptions;
		})
	}

	CategoriesFactory.getUserSubscriptionsDetailed = function(){
		return $http.get('/api/subscriptions/user/me?long=true')
		.then(function(response){
			if (response.data !== currentSubscriptionsDetailed) {
				console.log('Detailed subscriptions retrieved: ', response.data);
				angular.copy(response.data, currentSubscriptionsDetailed);
			}
		  return currentSubscriptionsDetailed;
		})
	}

	//Second parameter optional
	CategoriesFactory.createNewSubscription = function(name, pageId){
		var data = {description: name};
		if(pageId) data.page = pageId

		return $http.post('/api/subscriptions/', data)
		.then(function(response){
			if (currentSubscriptions.indexOf(response.data) === -1) {
				console.log('New subscription added: ', response.data);
				currentSubscriptions.push(response.data);
			}
			return response.data;
		})
	}

	CategoriesFactory.addToSubscription = function(categoryId, articleId){
		var data = {page: articleId};
		return $http.put('/api/subscriptions/' + categoryId, data)
		.then(function(response){
			var idx = _.chain(currentSubscriptions).pluck('_id').indexOf(categoryId).value();
			if (idx !== -1) {
				if (currentSubscriptions[idx].pages.indexOf(articleId) === -1) {
					console.log('Page added to subscription: ', response.data);
					currentSubscriptions[idx].pages.push(articleId);
				}
			}
			return response.data;
		})
	}

	//If user is admin, this deletes the subscription
	CategoriesFactory.removeSubscription = function(id){
		return $http.delete('/api/subscriptions/' + id)
		.then(function(response){
			return response.data;
		})
	}

	// -------------------------------------------------------

	CategoriesFactory.getUserFolders = function(){
		return $http.get('/api/folders/user/me')
		.then(function(response){
			return response.data;
		})
	}

	CategoriesFactory.getUserFoldersDetailed = function(){
		return $http.get('/api/folders/user/me?long=true')
		.then(function(response){
		  return response.data;
		})
	}

	CategoriesFactory.createNewFolder = function(name, pageId){
		var data = {description: name};
		if(pageId) data.page = pageId

		return $http.post('/api/folders/', data)
		.then(function(response){
			return response.data;
		})
	}

	CategoriesFactory.addToFolder = function(categoryId, articleId){
		var data = {page: articleId};
		return $http.put('/api/folders/' + categoryId, data)
		.then(function(response){
			return response.data;
		})
	}

	CategoriesFactory.removeFolder  = function(id){
		return $http.delete('/api/folders/' + id)
		.then(function(response){
			return response.data;
		})
	}

	return CategoriesFactory;
});
