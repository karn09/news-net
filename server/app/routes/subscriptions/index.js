'use strict';
var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');
var Category = mongoose.model('Category');

var type = 'public';

//Admin 
router.get('/', function(req, res, next){
  	Category.find({type: type})
	.then(function(subscriptions){
		res.send(subscriptions);
	})
});

//Shortcut for below
router.get('/user/me', function(req, res, next){

	var field = '';
	if(req.query.long) field = 'pages'

	Category.find({type: type, subscribers: req.session.passport.user})
	.populate(field)
	.then(function(subscriptions){
		res.send(subscriptions);
	}, next)
})

//Admin or self
router.get('/user/:id', function(req, res, next){
	Category.find({type: type, subscribers: req.params.userId})
	.then(function(subscriptions){
		res.send(subscriptions);
	}, next)
})


//Admin, owner, or subscriber
router.get('/:id', function(req, res, next){
	Category.findById(req.params.id)
	.then(function(subscription){
		res.send(subscription);
	}, next)
});

//Logged in user
router.post('/', function(req, res, next){
	var pages = [];
	if(req.body.page) pages.push(req.body.page);

	var category = new Category({
		type: type,
		description: req.body.description,
		pages: pages,
		admin: req.session.passport.user
	})

	category.save()
	.then(function(subscription){
		console.log("subscription", subscription)
		res.send(subscription)
	}, next);
});

//Logged in user
router.put('/:id/add', function(req, res, next){
  Category.findById(req.params.id)
  .then(function(subscription){
  	var subscriptionIndex = subscription.subscribers.indexOf(req.session.passport.user);
  	if(subscriptionIndex < 0) subscription.subscribers.push(req.session.passport.user)
  	return subscription.save();
  })
  .then(function(subscribedSubscription){
  	res.send(subscribedSubscription);
  })
});

//Admin or owner
router.put('/:id', function(req, res, next){
	Category.findById(req.params.id)
	.then(function(subscription){
		if(req.body.page) subscription.pages.push(req.body.page);
		if(req.body.pages) subscription.pages = subscription.pages.concat(req.body.pages);
		return subscription.save();
	})
	.then(function(updatedSubscription){
		res.send(updatedSubscription);
	}, next);
});


//Subscriber
router.delete('/:id', function(req, res, next){
	Category.findById(req.params.id)
	.then(function(subscription){
		if(subscription.admin.equals(req.session.passport.user)){
			subscription.remove(); //If admin attempts to delete subscription, remove from DB.
		}else{
			var subscriptionIndex = subscription.subscribers.indexOf(req.session.passport.user);
			if( subscriptionIndex >= 0) subscription.subscribers.splice(subscriptionIndex, 1);
			subscription.save(); //If ordinary user hits delete route, we're just removing them from list of subscribers.
		}	
	})
	.then(function(unsubscribedSubscription){
		res.send(unsubscribedSubscription); //Remove subscriber IDs
	})
})