app.directive('sidebar', function (CategoriesFactory) {
	return {
		restrict: 'E',
		scope: {},
		templateUrl: 'app/common/directives/sidebar/sidebar.html',

		link: function(scope) {

			CategoriesFactory.getUserSubscriptions()
			.then(function(subscriptions){
				scope.subscriptions = subscriptions;
			})

			CategoriesFactory.getUserFolders()
			.then(function(folders){
				scope.folders = folders;
			})

			console.log("Sidebar scope", scope)
		    $(".menu-up").click(function(){
		    	if($(this).css('transform')	!== 'none'){
		    		$(this).css("transform", "");
		    		if($(this).attr('id') === 'subscriptions-icon')
		    			$('#subscriptions').show(400);
		    		if($(this).attr('id') === 'folders-icon')
		    			$('#folders').show(400);
		    	}
		    	else{
					$(this).css("transform", "rotate(180deg)");
		    		if($(this).attr('id') === 'subscriptions-icon')
		    			$('#subscriptions').hide(400);
		    		if($(this).attr('id') === 'folders-icon')
		    			$('#folders').hide(400);				
		    	}
			});

		}
	}
})
