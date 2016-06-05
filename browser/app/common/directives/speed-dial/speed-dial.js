app.directive('speedDial', function ($mdDialog) {
	return {
		restrict: 'E',
		scope: {},
		templateUrl: '/app/common/directives/speed-dial/speed-dial.html',
		link: function (scope, element, attribute) {
			scope.isOpen = false;
			scope.count = 0;
			scope.hidden = false;
			scope.hover = false;

			scope.items = [{
				name: "Add URL",
				icon: "/icons/ic_add_white_36px.svg",
				type: "url",
				direction: "top"
			}, {
				name: "Add Category",
				type: "category",
				icon: "/icons/ic_playlist_add_white_36px.svg",
				direction: "top"
			}];

			scope.openDialog = function($event, item) {
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
