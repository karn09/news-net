app.config(function ($stateProvider) {

    $stateProvider.state('login', {
        url: '/login',
        templateUrl: 'app/login/login.html',
        controller: 'LoginCtrl'
    });

});

app.controller('LoginCtrl', function ($scope, $rootScope, AuthService, $state) {

    $scope.login = {};
    $scope.error = null;

    $scope.sendLogin = function (loginInfo) {

        $scope.error = null;

        AuthService.login(loginInfo).then(function (loggedInUser) {
            $state.go('home');
            $rootScope.loggedInUser = loggedInUser;
            console.log($rootScope.loggedInUser);
        }).catch(function () {
            $scope.error = 'Invalid login credentials.';
        });

    };

});