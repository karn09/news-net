'use strict';
var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');
var Page = mongoose.model('Page');


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
	console.log("inside page post: ", req.body);
	var newPage = new Page({
		content: req.body.content,
		datePublished: req.body.date_published,
		domain: req.body.domain,
		excerpt: req.body.excerpt,
		leadImageUrl: req.body.lead_image_url,
		title: req.body.title,
		url: req.body.url
	});
	newPage.save()
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
 