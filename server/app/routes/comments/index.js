'use strict';
var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');
var Comment = mongoose.model('Comment');
var Page = mongoose.model('Page');
var User = mongoose.model('User');

router.get('/', function(req, res, next){
	Comment.find({})
	.populate(['user'])
	.then(function(comments){
		res.json(comments);
	}, next);
});


router.get('/:id', function(req, res, next){
	Comment.find({_id: req.params.id})
	.populate(['user'])
	.then(function(comment){
		res.json(comment);
	}, next);
});


router.get('/page/:id', function(req, res, next){
	Page.findById(req.params.id)
	.then(function(page){
		Comment.find({page: req.params.id})
		.populate(['user'])
		.then(function(comments){
			var response = {
				for: page.title,
				type: 'page',
				comments: comments
			}
			
			res.json(response);
		}, next);		
	})
	
});

router.get('/user/:id', function(req, res, next){
	User.findById(req.params.id)
	.then(function(user){
		Comment.find({user: req.params.id})
		.populate('page', '_id')
		.populate('page', 'title')
		.then(function(comments){
			var response = {
				for: user.email,
				type: 'user',
				comments: comments
			}

			res.send(response);

		}, next)
	})
});

router.post('/page/:id', function(req, res, next){
	var newComment = new Comment({
		user: req.session.passport.user,
		page: req.params.id,
		text: req.body.text,
		date: Date.now()
	});
	newComment.save()
	.then(function(response){
		response.populate('user', function(err, doc){
			if(!err) res.send(doc);
			else res.send(err);
		})
	});
});

router.put('/:id', function(req, res, next){
	Comment.findById(req.params.id)
	.then(function(comment){
		comment.text = req.body.text,
		comment.dateEdited = Date.now();
		return comment.save();
	})
	.then(function(response){
		response.populate('user', function(err, doc){
			if(!err) res.send(doc);
			else res.send(err);
		})
	}, next);	
});

router.put('/:id/upvote/', function(req, res, next){
	Comment.findById(req.params.id).select('votes')
	.then(function(comment){
		var upvote = {
			userId: req.session.passport.user,
			vote: 1
		}

		var indexIfExists = comment.votes.map(function(element){ 
			return element.userId + "";
		}).indexOf(upvote.userId + "");

		if(indexIfExists >= 0){
			comment.votes[indexIfExists] = upvote;
		}else{
			comment.votes.push(upvote);
		}
		
		return comment.save()
	}).then(function(response){ res.send("Upvoted comment " + response._id)}, next);
});

router.put('/:id/downvote/', function(req, res, next){
	Comment.findById(req.params.id).select('votes')
	.then(function(comment){
		var downvote = {
			userId: req.session.passport.user,
			vote: -1
		}

		var indexIfExists = comment.votes.map(function(element){ 
			return element.userId + "";
		}).indexOf(downvote.userId + "");

		if(indexIfExists >= 0){
			comment.votes[indexIfExists] = downvote;
		}else{
			comment.votes.push(downvote);
		}

		return comment.save()
	}).then(function(response){ res.send("Downvoted comment " + response._id)}, next);	
});

router.delete('/:id', function(req, res, next){
	Comment.findOneAndRemove({_id: req.params.id})
	.then(function(response){
		res.send(response);
	}, next);
});

module.exports = router;
