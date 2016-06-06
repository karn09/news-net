app.factory('ParserFactory', function($http){

	var ParserFactory = {};

	ParserFactory.parseUrl = function(url, userid, categories) {
		//1. parse the Url
		//2. post to pages
		//3. add page to user's list
		//4. add page to categories

		var encoded = encodeURIComponent(url);
		return $http.get("/api/parser/" + encoded)
		.then(function(result){
			//console.log("userid: ", userid);
			return $http.post("/api/pages", result.data)
			.then(function(pageResponse) {
				//console.log("page parsed: ", pageResponse.data);
				return $http.put("/api/users/addPage/" + userid, {page: pageResponse.data._id})
					.then(function(res){
						if (categories) {
							var toUpdate = [];
							for (var i = 0; i < categories.length; i++) {
								//console.log("adding page to category: ", categories[i]);
								toUpdate.push($http.put("/api/categories/addPage/" + categories[i], {page: pageResponse.data._id}));
							}
							console.log("toUpdate: ", toUpdate);
							return Promise.all(toUpdate)
								.then(function(response){
									//console.log("all categories updated");
									return pageResponse.data;
								})
						} else {
							return pageResponse.data;
						}
					})
			})
		});
	};



	return ParserFactory;

});
