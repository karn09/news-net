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
  //if page exists, increment userCount. otherwise create new page
  Page.findOne({url: req.body.url})
    .then(function(page){
      if (page){
        page.userCount = page.userCount + 1;
        page.save()
        .then(function(updatedPage){
          res.send(updatedPage);
        })
      } else {
          var newPage = new Page({
            content: req.body.content,
            datePublished: req.body.date_published,
            domain: req.body.domain,
            excerpt: req.body.excerpt,
            leadImageUrl: req.body.lead_image_url,
            title: req.body.title,
            url: req.body.url,
            userCount: 1
          });
        newPage.save()
          .then(function(savedPage){
            res.send(savedPage);
          })
      }
    })
});

router.delete('/:id', function(req, res, next){
	Page.findOneAndRemove({_id: req.params.id})
	.then(function(response){
		res.send(response);
	}, next);
});

module.exports = router;

