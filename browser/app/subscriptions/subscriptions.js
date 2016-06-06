app.config(function ($stateProvider) {
	$stateProvider.state('subscriptions', {
		url: '/subscriptions',
		templateUrl: 'app/subscriptions/subscriptions.html',
		controller: 'SubscriptionsCtrl'
	});
});

app.controller('SubscriptionsCtrl', function($scope) {

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