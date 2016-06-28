app.directive('sectionsView', function (CategoriesFactory) {
	return {
		restrict: 'E',
		scope: { categories: '=', removeFromFunction: '&?'},
		templateUrl: 'app/common/directives/sections/sections-view.html',

		link: function(scope) {
			scope.menuUp = function(category){
				category = category.toLowerCase();
				var menuUpId = '#' + category + '-menu-up'
				var listId = '#' + category;
				if($(menuUpId).css('transform')	!== 'none'){
					$(menuUpId).css("transform", "");
					$(listId).show(400);
				}
				else{
					$(menuUpId).css("transform", "rotate(180deg)");
					$(listId).hide(400);				
				}		
			};
			
			if(!!scope.removeFromFunction){
				scope.pass = true;
				scope.removeItemFromSection = function(categoryId){

					return function removePageFromSection(pageId){
						// console.log("Inner Function with Category: ", categoryId, " & Page: ", pageId);
						return scope.removeFromFunction({categoryId: categoryId, pageId: pageId});
					}
				}
			}else{
				scope.pass = false;
			}
			
		}
	}
})
