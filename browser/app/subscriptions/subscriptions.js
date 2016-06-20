app.config(function ($stateProvider) {
	$stateProvider.state('subscriptions', {
		url: '/subscriptions',
		templateUrl: 'app/subscriptions/subscriptions.html',
		resolve: {
			categories: function(CategoriesFactory){
				return CategoriesFactory.getUserSubscriptionsDetailed();
			}
		},
		controller: 'SubscriptionsCtrl'
	});
});

app.controller('SubscriptionsCtrl', function($scope, categories) {

	$scope.categories = categories;

});