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

	return CategoriesFactory
});