app.factory('PagesFactory', function($http){
	var PagesFactory = {}

	PagesFactory.getSaved = function(){
		return $http.get("/api/pages")
		.then(function(response){
			console.log(response.data)
			return response.data;
		})
	}

	return PagesFactory;
})
