app.config(function($stateProvider){

	$stateProvider.state('pages', {
	    url: '/pages',
	    templateUrl: 'app/pages/pages.html', //Still need to make
	    controller: 'PagesCtrl'
	});

})

app.controller('PagesCtrl', function($scope, PagesFactory){

	PagesFactory.getSaved()
	.then(function(response){
		$scope.pages = response;
	})

})