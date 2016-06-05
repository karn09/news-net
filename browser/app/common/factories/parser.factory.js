app.factory('ParserFactory', function($http){

	var ParserFactory = {};

	ParserFactory.parseUrl = function(url, userid) {

		var encoded = encodeURIComponent(url);
		//console.log("encoded: ", encoded);
		return $http.get("/api/parser/" + encoded)
		.then(function(result){
			//return result.data
			//console.log("parser result: ", result.data);
            result.data.userid = userid;
            console.log("userid: ", userid);
			return $http.post("/api/pages", result.data)
			.then(function(response){
				console.log("post response: ", response.data);
				return response.data;
			})
		});
	};

	return ParserFactory;

});
