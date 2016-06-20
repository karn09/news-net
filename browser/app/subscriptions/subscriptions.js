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
			controller: function(){
				console.log("hfhrf")
			}
		})
});


app.controller('SubscriptionsCtrl', function($scope, categories) {

	$scope.categories = categories;

});

app.controller('SubscriptionSectionCtrl', function($scope, $stateParams, categories){
	console.log("HI FROM CTRL")
});