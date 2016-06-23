app.directive('sidebar', function (CategoriesFactory) {
	return {
		restrict: 'E',
		scope: {},
		templateUrl: 'app/common/directives/sidebar/sidebar.html',

		link: function(scope) {

			CategoriesFactory.getUserFolders()
			.then(function(folders){
				scope.folders = folders;
			})

			CategoriesFactory.getUserSubscriptions()
			.then(function(subscriptions){
				scope.subscriptions = subscriptions;
			})

			scope.removeFolder = function(id){
				CategoriesFactory.removeFolder(id)
				.then(function(){
					var index = scope.folders.map(function(element){ 
						return element._id;
					}).indexOf(id);

					scope.folders.splice(index, 1);
				})
			}

			scope.removeSubscription = function(id){
				CategoriesFactory.removeSubscription(id)
				.then(function(){
					var index = scope.subscriptions.map(function(element){ 
						return element._id;
					}).indexOf(id);
					
					scope.subscriptions.splice(index, 1);
				})
			}

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
