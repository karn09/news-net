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
    //1. get user object
    //2. check if page already exists
    //3. if yes, increment the count on the page
    //4. if not, create new page
    //5. update user object with new page

    //Shouldn't we use req.session.passport.user?
    var sessionUserId = req.session.passport.user;
    User.findOne({_id: sessionUserId})
        .then(function(user){
            Page.findOne({url: req.body.url})
                .then(function(page){
                    if (page) {
                        console.log("page already existed: ", page);
                        page.userCount = page.userCount + 1;
                        console.log("updated userCount: ", page.userCount);
                        page.save()
                            .then(function(updatedPage){
                                user.pages.push(updatedPage._id);
                                console.log("updated user pages: ", user.pages);
                                user.save()
                                    .then(function(response){
                                        res.send(updatedPage);
                                    })
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
                            .then(function(page){
                                console.log("created new page: ", page);
                                user.pages.push(page._id);
                                console.log("updated user pages: ", user.pages);
                                user.save()
                                    .then(function(response){
                                        res.send(page);
                                    })
                            })
                    }
                })
        })
});


router.delete('/:id', function(req, res, next){
	Page.findOneAndRemove({_id: req.params.id})
	.then(function(response){
		res.send(response);
	}, next);
});

module.exports = router;

