app.directive('speedDial', function ($mdDialog, $state, $rootScope, CategoriesFactory) {
	return {
		restrict: 'E',
		scope: {},
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
								direction: "top",
								action: 'openDialog', 
								controller: 'addArticleFormCtrl',
								controllerAs: 'dialog',
								templateUrl: '/app/common/dialogs/article-dialog/article-dialog.html',
								resolve: {
									folders: function(){
										return CategoriesFactory.getUserFolders();
									},
									subscriptions: function(){
										return CategoriesFactory.getUserSubscriptions();
									}
								}
							},
							{
								name: "New Folder / Subscription",
								icon: "/assets/icons/ic_playlist_add_white_36px.svg",
								direction: "bottom",
								action: 'openDialog',
								controller: "addCategoryFormCtrl",
								controllerAs: 'dialog',
								templateUrl: '/app/common/dialogs/category-dialog/category-dialog.html'
							}
						],
						takeAction: function($event, item){
							act($event, item, this);
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
								direction: "top",
								action: 'openLink',
								goto: "pageComments",
								data: {id: toParams.id}
							},
							{
								name: "Placeholder",
								type: "placeholder",
								icon: "",
								direction: "bottom"
							}

						],
						takeAction: function($event, item){
							act($event, item, this);
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

			//Actions
			function act($event, item, context){
				if(item.action === 'openDialog'){
					$mdDialog.show({
						scope: context,
						preserveScope: true,
						clickOutsideToClose: true,
						controller: item.controller,
						controllerAs: item.controllerAs,
						templateUrl: item.templateUrl,
						targetEvent: $event,
						locals: {
							item: item
						},
						resolve: item.resolve
						
					})
				}
				
				if(item.action === 'openLink'){
					$state.go(item.goto, item.data);
				}
			}

		} //End link
	}
})
