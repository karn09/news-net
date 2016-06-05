app.directive('speedDial', function ($mdDialog, $state, $rootScope) {
	return {
		restrict: 'E',
		scope: {},
		controller: function ($state, $rootScope) {
			// $watch($state.current, function(val) {
			// 	console.log(val)
			// })
			// console.log($state.current)
			// $rootScope.$watch($state.current.name, function (oldVal, newVal) {
			// 	console.log(this)
			// 	console.log(oldVal, newVal)
			// })
		},
		templateUrl: '/app/common/directives/speed-dial/speed-dial.html',
		link: function (scope, element, attribute) {
			scope.isOpen = false;
			scope.count = 0;
			scope.hidden = false;
			scope.hover = false;
			console.log(scope)
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
