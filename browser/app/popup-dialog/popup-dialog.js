app.controller('dialogFormCtrl', function ($mdDialog, ParserFactory, Session) {
	this.close = function () {
		$mdDialog.cancel();
	};
	this.submit = function (type, data) {
		// if type category, send to category api
		// if type url, send to url api
		if (type === 'url') {
			ParserFactory.parseUrl(data, Session.user._id)
				.then(function (response) {
					$mdDialog.hide();
					$scope.parsed = response;
				});
		} else if (type === 'category') {
      // not set up yet
			$mdDialog.hide();
		}
	}
})
