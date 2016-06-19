'use strict';
var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');

var Promise = require('bluebird');

var User = mongoose.model('User');

router.get('/', function(req, res, next){
	User.find({},{email: 1, pages: 1})
	.populate('pages')
	.then(function(users){
		res.json(users);
	})
	.then(null, next);
});

router.get('/:id', function(req, res, next){
	User.find({_id: req.params.id})
	.populate('pages')
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
		user.pages.push(req.body.page); //Need to change this (by page ID for existing page, not resave entire contents)
		return user.save();
	})
	.then(function(response){
		res.send(response);
	}, next);
});

router.put('/removePage/:pageId', function(req, res, next){
	User.findOne({_id: req.session.passport.user})
	.then(function(user){
		var index = user.pages.indexOf(req.params.pageId);
		if(index > -1){
			user.pages.splice(index, 1);
			return user.save();
		}else{
			res.send("Error Deleting: Page not found.")
		}
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
