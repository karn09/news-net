app.config(function ($stateProvider) {
	$stateProvider
		.state('subscriptions', {
			url: '/subscriptions',
			templateUrl: 'app/subscriptions/subscriptions.html',
			resolve: {
				categories: function(CategoriesFactory){
					return CategoriesFactory.getUserSubscriptionsDetailed();
				}
			},
			controller: 'SubscriptionsCtrl'
		})

		.state('subscriptions.section', {
			parent: 'subscriptions',
			url: '/:name',
			templateUrl: 'app/subscriptions/subscriptions.html',
			controller: 'SubscriptionSectionCtrl'
		})
});


app.controller('SubscriptionsCtrl', function($scope, categories) {

	$scope.categories = categories;

});

app.controller('SubscriptionSectionCtrl', function($scope, $stateParams, categories){
	var subscriptionIndex = categories.map(function(element){
		return element.description.toLowerCase();
	}).indexOf($stateParams.name.toLowerCase());

	$scope.categories = [categories[subscriptionIndex]];
	console.log("index", subscriptionIndex, "overwrite", $scope.categories)
});