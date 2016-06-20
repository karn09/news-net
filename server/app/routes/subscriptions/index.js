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

//Admin or self
router.get('/user/:id', function(req, res, next){
	Category.find({type: type, subscribers: req.params.userId})
	.then(function(subscriptions){
		res.send(subscriptions);
	}, next)
})

//Shortcut for above
router.get('/user/me', function(req, res, next){
	Category.find({type: type, subscribers: req.session.passport.user})
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
		res.send(subscription)
	}, next);
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

//Subscriber
//Soft Delete - Remove user from subscribers list
router.delete('/:id', function(req, res, next){
	Category.findById(req.params.id)
	.then(function(subscription){
		var subscriptionIndex = subscription.subscribers.indexOf(req.session.passport.user);
		if( subscriptionIndex >= 0) subscription.subscribers.splice(subscriptionIndex, 1);
		subscription.save();
	})
	.then(function(unsubscribedSubscription){
		res.send(unsubscribedSubscription); //Remove subscriber IDs
	})
})