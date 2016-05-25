app.factory('ParserFactory', function($http){

	var ParserFactory = {};

	ParserFactory.parseUrl = function(url) {

		var encoded = encodeURIComponent(url);
		//console.log("encoded: ", encoded);
		return $http.get("/api/parser/" + encoded)
		.then(function(result){
			return result.data;
		});
	};

	return ParserFactory;

});
