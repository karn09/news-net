app.directive('speedDial', function ($mdDialog, $state, $rootScope) {
	return {
		restrict: 'E',
		scope: {},
		controller: function ($state, $rootScope, $scope) {
			// $rootScope.$on('$stateChangeSuccess',
			//   function(event, toState, toParams, fromState, fromParams) {
			//     console.log("Controller State: ", $scope.state);
			//   }
			// )
		},
		templateUrl: '/app/common/directives/speed-dial/speed-dial.html',
		link: function (scope, element, attribute) {

			scope.$root.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams){
				console.log("Link State: ", toState.name);
			});
			

			scope.isOpen = false;
			scope.count = 0;
			scope.hidden = false;
			scope.hover = false;
			scope.items = [{
				name: "Add URL",
				icon: "/assets/icons/ic_add_white_36px.svg",
				type: "url",
				direction: "top"
			}, {
				name: "Add Category",
				type: "category",
				icon: "/assets/icons/ic_playlist_add_white_36px.svg",
				direction: "bottom"
			}];


			scope.openDialog = function ($event, item) {
				$mdDialog.show({
					scope: this,
					preserveScope: true,
					clickOutsideToClose: true,
					controller: 'dialogFormCtrl',
					controllerAs: 'dialog',
					templateUrl: '/app/popup-dialog/popup-dialog.html',
					targetEvent: $event,
					locals: {
						item: item
					}
				})
			}

		}
	}
})
