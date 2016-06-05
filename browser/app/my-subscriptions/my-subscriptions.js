app.config(function ($stateProvider) {
	$stateProvider.state('mySubscriptions', {
		url: '/subscriptions',
		templateUrl: 'app/my-subscriptions/my-subscriptions.html',
		controller: 'mySubscriptionsCtrl'
	});
});

app.controller('mySubscriptionsCtrl', function($scope) {

	$(".subscriptions-menu-up").click(function(){
		var id = '#' + $(this).attr('id').slice(0,-8);
		if($(this).css('transform')	!== 'none'){
			$(this).css("transform", "");
			$(id).show(400);
		}
		else{
			$(this).css("transform", "rotate(180deg)");
			$(id).hide(400);				
		}
	});

});