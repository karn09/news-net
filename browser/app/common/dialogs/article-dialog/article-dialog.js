app.controller('addArticleFormCtrl', function ($mdDialog, ArticlesFactory, Session) {

	this.close = function () {
		$mdDialog.cancel();
	};
	this.submit = function (type, data) {
		// if type category, send to category api
		// if type url, send to url api

		console.log("(submit) type: ", type);
		console.log("(submit) data: ", data);

		if (type === 'url') {
			ArticlesFactory.parseUrl(data, Session.user._id)
				.then(function (response) {
					$mdDialog.hide();
					// $scope.parsed = response;
				});
		} else if (type === 'category') {
      // not set up yet
			$mdDialog.hide();
		}
	}
})
