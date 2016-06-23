app.factory('CategoriesFactory', function ($http) {
	var CategoriesFactory = {};

	CategoriesFactory.getUserSubscriptions = function(){
		return $http.get('/api/subscriptions/user/me')
		.then(function(response){
		  return response.data;
		})
	}

	CategoriesFactory.getUserSubscriptionsDetailed = function(){
		return $http.get('/api/subscriptions/user/me?long=true')
		.then(function(response){
		  return response.data;
		})
	}

	//Second parameter optional
	CategoriesFactory.createNewSubscription = function(name, pageId){
		var data = {description: name};
		if(pageId) data.page = pageId

		return $http.post('/api/subscriptions/', data)
		.then(function(response){
			return response.data;
		})
	}

	CategoriesFactory.addToSubscription = function(categoryId, articleId){
		var data = {page: articleId};
		return $http.put('/api/subscriptions/' + categoryId, data)
		.then(function(response){
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