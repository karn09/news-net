app.controller('addCategoryFormCtrl', function ($mdDialog, CategoriesFactory, Session) {


	this.close = function () {
		$mdDialog.cancel();
	};
	this.submit = function (data) {
		// if type category, send to category api
		// if type url, send to url api

		if(!!data.public){
			CategoriesFactory.createNewSubscription(data.name)
			.then(function(response){
				console.log("Successfully created subscription:\n", response);
				$mdDialog.hide();
			})
		}else{
			CategoriesFactory.createNewFolder(data.name)
			.then(function(response){
				console.log("Successfully created folder:\n", response);
				$mdDialog.hide();
			})
		}

	}

})