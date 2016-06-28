app.directive('navbar', function ($rootScope, AuthService, AUTH_EVENTS, $state, $mdSidenav, $mdInkRipple) {

    return {
        restrict: 'E',
        scope: {},
        templateUrl: 'app/common/directives/navbar/navbar.html',
        link: function (scope, element) {

            scope.toggle = function() {
                $mdSidenav("left").toggle();
            };

            scope.items = [
                { label: 'Home', state: 'home' },
                { label: 'Parser', state: 'parser' },
                { label: 'Pages', state: 'pages' },
                { label: 'Members Only', state: 'membersOnly', auth: true }
            ];

            scope.user = null;

            scope.isLoggedIn = function () {
                return AuthService.isAuthenticated();
            };

            scope.logout = function () {
                AuthService.logout().then(function () {
                   $state.go('login');
                   $rootScope.loggedInUser = null;
                });
            };

            scope.refresh = function() {
              console.log('Reloading UI states...')
              $state.reload();
            }

            var setUser = function () {
                AuthService.getLoggedInUser().then(function (user) {
                    scope.user = user;
                });
            };

            var removeUser = function () {
                scope.user = null;
            };

            setUser();

            $rootScope.$on(AUTH_EVENTS.loginSuccess, setUser);
            $rootScope.$on(AUTH_EVENTS.logoutSuccess, removeUser);
            $rootScope.$on(AUTH_EVENTS.sessionTimeout, removeUser);

        }

    };

});
