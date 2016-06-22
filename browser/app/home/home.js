app.config(function ($stateProvider) {
    $stateProvider.state('home', {
        url: '/',
        templateUrl: 'app/home/home.html',
        resolve: {
        	user: function(AuthService) {
        		return AuthService.getLoggedInUser();
        	}
        },
        controller: 'HomepageCtrl'
    });
});

app.controller('HomepageCtrl', function($scope, user) {
	$scope.user = user;
	console.log($scope.user);
});