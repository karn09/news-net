app.directive('sectionsView', function (CategoriesFactory) {
	return {
		restrict: 'E',
		scope: { categories: '='},
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
		}
	}
})
