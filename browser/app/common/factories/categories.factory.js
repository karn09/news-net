app.factory('CategoriesFactory', function ($http) {
	var CategoriesFactory = {};
	var currentSubscriptions = [];
	var currentSubscriptionsDetailed = [];
	var currentFoldersDetailed = [];
	var currentFolders = [];

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
	// this currently only adds the article ID to an array of pages associated with a subscription.
	// does not update the detailed categories.
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

	CategoriesFactory.removeFromSubscription = function(categoryId, articleId){
		return $http.delete('/api/subscriptions/' + categoryId + '/pages/' + articleId)
		.then(function(response){

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
		})
	}

	//If user is admin, this deletes the subscription
	CategoriesFactory.removeSubscription = function(id){
		return $http.delete('/api/subscriptions/' + id)
		.then(function(response){
			_.remove(currentSubscriptions, function(subscription) {
				return subscription._id === id;
			})
			return response.data;
		})
	}

	// -------------------------------------------------------
	// FIXME: Sometimes data retrieved is via ServiceWorker- which ends up being stale.
	CategoriesFactory.getUserFolders = function(){
		return $http.get('/api/folders/user/me')
		.then(function(response){
			if (response.data !== currentFolders) {
				console.log('User folders retrieved: ', response.data);
				angular.copy(response.data, currentFolders);
			}
			return currentFolders;
		})
	}

	CategoriesFactory.getUserFoldersDetailed = function(){
		return $http.get('/api/folders/user/me?long=true')
		.then(function(response){
			if (response.data !== currentFoldersDetailed) {
				console.log('Detailed User folders retrieved: ', response.data);
				angular.copy(response.data, currentFoldersDetailed);
			}
		  return currentFoldersDetailed;
		})
	}

	CategoriesFactory.createNewFolder = function(name, pageId){
		var data = {description: name};
		if(pageId) data.page = pageId

		return $http.post('/api/folders/', data)
		.then(function(response){
			if (currentFolders.indexOf(response.data) === -1) {
				console.log('New folder added: ', response.data);
				currentFolders.push(response.data);
			}
			return response.data;
		})
	}

	CategoriesFactory.addToFolder = function(categoryId, articleId){
		var data = {page: articleId};
		return $http.put('/api/folders/' + categoryId, data)
		.then(function(response){
			var idx = _.chain(currentFolders).pluck('_id').indexOf(categoryId).value();
			if (idx !== -1) {
				if (currentFolders[idx].pages.indexOf(articleId) === -1) {
					console.log('Page added to subscription: ', response.data);
					currentFolders[idx].pages.push(articleId);
				}
			}
			return response.data;
		})
	}

	CategoriesFactory.removeFromFolder = function(categoryId, articleId){

		return $http.delete('/api/folders/' + categoryId + '/pages/' + articleId)
		.then(function(response){

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
		})
	}

	CategoriesFactory.removeFolder  = function(id){
		return $http.delete('/api/folders/' + id)
		.then(function(response){
			_.remove(currentFolders, function(folder) {
				return folder._id === id;
			})
			return response.data;
		})
	}

	return CategoriesFactory;
});
