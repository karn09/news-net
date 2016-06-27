app.config(function($stateProvider){
	$stateProvider
		.state('folders', {
			url: '/folders',
			templateUrl: 'app/folders/folders.html',
			resolve: {
				categories: function(CategoriesFactory){
					return CategoriesFactory.getUserFoldersDetailed();
				}
			},
			controller: 'FoldersCtrl'
		})

		.state('folders.section', {
			parent: 'folders',
			url: '/:name',
			templateUrl: 'app/folders/folders.html',
			controller: 'FolderSectionCtrl'
		})

})

app.controller('FoldersCtrl', function($scope, categories, CategoriesFactory) {

	$scope.categories = categories;

	$scope.removeFromFolder = function(categoryId, articleId){
		console.log("Folders Control - Remove From")
		CategoriesFactory.removeFromFolder(categoryId, articleId);
	}

});

app.controller('FolderSectionCtrl', function($scope, $stateParams, categories){
	var folderIndex = categories.map(function(element){
		return element.description.toLowerCase();
	}).indexOf($stateParams.name.toLowerCase());

	$scope.categories = [categories[folderIndex]];
});