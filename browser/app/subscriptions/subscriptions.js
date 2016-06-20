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

	$scope.menuUp = function(category){
		category = category.toLowerCase();
		var menuUpId = '#' + category + '-menu-up'
		var listId = '#' + category;
		if($(menuUpId).css('transform')	!== 'none'){
			$(menuUpId).css("transform", "");
			$(listId).show(400);
		}
		else{
			$(menuUpId).css("transform", "rotate(180deg)");
			$(listId).hide(400);				
		}		
	};

});