app.config(function($stateProvider){
	$stateProvider.state('folders', {
		url: '/folders',
		templateUrl: 'app/folders/folders.html',
		resolve: {
			categories: function(CategoriesFactory){
				return CategoriesFactory.getUserFoldersDetailed();
			}
		},
		controller: 'FoldersCtrl'
	});
})

app.controller('FoldersCtrl', function($scope, categories) {

	$scope.categories = categories;

});