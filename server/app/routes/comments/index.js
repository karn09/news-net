'use strict';
var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');
var Comment = mongoose.model('Comment');


router.get('/', function(req, res, next){
	Comment.find({})
	.populate(['page', 'user'])
	.then(function(comments){
		res.json(comments);
	}, next);
});


router.get('/:id', function(req, res, next){
	Comment.find({_id: req.params.id})
	.populate(['page', 'user'])
	.then(function(comment){
		res.json(comment);
	}, next);
});


router.get('/page/:id', function(req, res, next){
	Comment.find({page: req.params.id})
	.populate(['page', 'user'])
	.then(function(comments){
		res.json(comments);
	}, next);
});

router.get('/user/:id', function(req, res, next){
	Comment.find({user: req.params.id})
	.populate(['page', 'user'])
	.then(function(comments){
		res.json(comments);
	}, next);
});

router.post('/', function(req, res, next){
	var newComment = new Comment({
		user: req.body.user,
		page: req.body.page,
		text: req.body.text,
		date: Date.now()
	});
	newComment.save()
	.then(function(response){
		res.send(response);
	});
});

router.put('/:id', function(req, res, next){
	Comment.findOne({_id: req.params.id})
	.then(function(comment){
		comment.text = req.body.text,
		comment.date = Date.now();
		return comment.save();
	})
	.then(function(response){
		res.send(response);
	}, next);	
});


router.delete('/:id', function(req, res, next){
	Comment.findOneAndRemove({_id: req.params.id})
	.then(function(response){
		res.send(response);
	}, next);
});

module.exports = router;
