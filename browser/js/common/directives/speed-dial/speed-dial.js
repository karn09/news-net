app.directive('speedDial', function ($mdDialog) {
	return {
		restrict: 'E',
		scope: {},
		templateUrl: 'html/speed-dial/speed-dial.html',
		link: function (scope, element, attribute) {
			scope.isOpen = false;
			scope.count = 0;
			scope.hidden = false;
			scope.hover = false;
      scope.items = [{
				name: "Add URL",
				icon: "/icons/ic_add_white_36px.svg",
				direction: "top"
			}, {
				name: "Add Category",
				icon: "/icons/ic_playlist_add_white_36px.svg",
				direction: "top"
			}];

			scope.openDialog = function($event, item) {
				$mdDialog.show({
					clickOutSideToClose: true,
					controller: 'dialogFormCtrl',
					templateUrl: '/html/popup-dialog/popup-dialog.html',
					targetEvent: $event
				})
			}

		}
	}
})
