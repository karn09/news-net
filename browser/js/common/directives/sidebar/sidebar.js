app.directive('sidebar', function () {
	return {
		restrict: 'E',
		scope: {},
		templateUrl: 'js/common/directives/sidebar/sidebar.html',
		link: function(scope) {
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
