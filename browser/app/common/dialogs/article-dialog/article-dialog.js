app.controller('addArticleFormCtrl', function ($mdDialog, ArticlesFactory, CategoriesFactory, Session, folders, subscriptions) {

	
	this.folders = folders;
	this.subscriptions = subscriptions;

	this.close = function () {
		$mdDialog.cancel();
	};
	this.submit = function (data) {
		// if type category, send to category api
		// if type url, send to url api

		console.log("(submit) data: ", data);

		ArticlesFactory.parseUrl(data, Session.user._id)
			.then(function (response) {
				$mdDialog.hide();
				// $scope.parsed = response;
			});
	}
})
