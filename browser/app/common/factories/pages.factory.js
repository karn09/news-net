app.factory('PagesFactory', function($http){
	var PagesFactory = {}

	PagesFactory.getSaved = function(){
		return $http.get("/api/pages")
		.then(function(response){
			return response.data;
		})
	}

	return PagesFactory;
})