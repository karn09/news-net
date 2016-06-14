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
				var optionsByState = {
					default: {
						isOpen: false,
						count: 0,
						hidden: false,
						hover: false,
						items: [
							{
								name: "Add URL",
								icon: "/assets/icons/ic_add_white_36px.svg",
								type: "url",
								direction: "top"
							},
							{
								name: "Add Category",
								type: "category",
								icon: "/assets/icons/ic_playlist_add_white_36px.svg",
								direction: "bottom"
							}
						],
						takeAction: function($event, item){
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
					},

					article: {
						isOpen: false,
						count: 0,
						hidden: false,
						hover: false,
						items: [
							{
								name: "Jump to Discussion",
								icon: "/assets/icons/ic_chat_48px.svg",
								goto: "pageComments",
								direction: "top"
							},
							{
								name: "Placeholder",
								type: "placeholder",
								icon: "",
								direction: "bottom"
							}

						],
						takeAction: function($event, item){
							$state.go(item.goto, {id: toParams.id});
						}
					}
				} //End optionsByState

				if(optionsByState[toState.name]){
					for(var key in optionsByState[toState.name]){
						scope[key] = optionsByState[toState.name][key];
					}
				}else{
					for(var key in optionsByState["default"]){
						scope[key] = optionsByState["default"][key];
					}
				}


			}); //End $on stateChangeSuccess

		} //End link
	}
})
