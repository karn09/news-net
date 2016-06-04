'use strict';
var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');
var Page = mongoose.model('Page');
var User = mongoose.model('User');


router.get('/', function(req, res, next){
	Page.find({})
	.then(function(pages){
		res.json(pages);
	}, next);
});


router.get('/:id', function(req, res, next){
	Page.find({_id: req.params.id})
	.then(function(page){
		res.json(page);
	}, next);
});


router.post('/', function(req, res, next){
	//console.log("*****inside page post: ", req.body);
	var newPage = new Page({
		content: req.body.content,
		datePublished: req.body.date_published,
		domain: req.body.domain,
		excerpt: req.body.excerpt,
		leadImageUrl: req.body.lead_image_url,
		title: req.body.title,
		url: req.body.url,
		numSave: 1
	});
	newPage.save()
        .then(function(page){
            User.findOne({_id: req.body.userid})
                .then(function(user){
                    user.pages.push(page._id);
                    return user.save();
                })
        })
	.then(function(response){
		res.send(response);
	});
});


router.delete('/:id', function(req, res, next){
	Page.findOneAndRemove({_id: req.params.id})
	.then(function(response){
		res.send(response);
	}, next);
});

module.exports = router;
