app.controller('addArticleFormCtrl', function ($mdDialog, ArticlesFactory, CategoriesFactory, Session, folders, subscriptions) {

	this.folders = folders;
	this.subscriptions = subscriptions;

	this.close = function () {
		$mdDialog.cancel();
	};
	this.submit = function (data) {
		
		console.log("Submitted Article Data: ", data);

		var categoryID = null;
		if(data.secondary) categoryID = data.secondary._id;

		ArticlesFactory.parseUrl(data.primary, Session.user._id, [categoryID])
			.then(function (response) {
				$mdDialog.hide();
				// $scope.parsed = response;
			});
	}
})
