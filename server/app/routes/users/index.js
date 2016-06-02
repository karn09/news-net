'use strict';
var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');

var Promise = require('bluebird');

var User = mongoose.model('User');
//var Page = mongoose.model('Page');
var Comment = mongoose.model('Comment');

router.get('/', function(req, res, next){
	User.find({},{email: 1, pages: 1, comments: 1})
	.populate('comments')
	.then(function(users){
		res.json(users);
	})
	.then(null, next);
});

router.get('/:id', function(req, res, next){
	User.find({_id: req.params.id})
	.populate('comments')
	.then(function(user){
		res.json(user);
	})
	.then(null, next);
});


router.post('/', function(req, res, next){
	var newUser = new User({
		email: req.body.email,
		password: req.body.password
	});
	newUser.save()
	.then(function(response){
		res.send(response);
	});
});


router.put('/addPage/:id', function(req, res, next){
	User.findOne({_id: req.params.id})
	.then(function(user){
		user.pages.push(req.body.page);
		return user.save();
	})
	.then(function(response){
		res.send(response);
	}, next);	
});


router.put('/addComment/:id', function(req, res, next){
	User.findOne({_id: req.params.id})
	.then(function(user){
		user.comments.push(req.body.comment);
		return user.save();
	})
	.then(function(response){
		res.send(response);
	}, next);	
});


router.put('/password/:id', function(req, res, next){
	User.findOne({_id: req.params.id})
	.then(function(user){
		user.password = req.body.password;
		return user.save();
	})
	.then(function(response){
		res.send(response);
	}, next);
});

router.delete('/:id', function(req, res, next){
	User.findOneAndRemove({_id: req.params.id})
	.then(function(response){
		res.send(response);
	}, next);
});
