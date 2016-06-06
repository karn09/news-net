'use strict';
var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');
var Page = mongoose.model('Page');
var User = mongoose.model('User');
var Category = mongoose.model('Category');

//Get all pages
router.get('/', function(req, res, next){
	Page.find({})
	.then(function(pages){
		res.json(pages);
	}, next);
});

//Get all pages for a given category
//Usage: /api/pages/category?id=<Category ID> or ?name=<Category Name>. If both, will default to ID.
router.get('/category/', function(req, res, next){

    if(req.query.id){

        Category.findById(req.query.id)
        .populate(['pages'])
        .then(function(category){
            res.send(category.pages);
        })

    }else if(req.query.name){

        Category.findOne({description: req.query.name})
        .populate(['pages'])
        .then(function(category){
            res.send(category.pages);
        })

    }else{
        res.send("Please provide a category name or ID.")
    }

    res.send("Category not found.")

})

//Get page by ID
router.get('/:id', function(req, res, next){
	Page.find({_id: req.params.id})
	.then(function(page){
		res.json(page);
	}, next);
});

//Post article
//Optional body param: 'category'
router.post('/', function(req, res, next){
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
})


router.delete('/:id', function(req, res, next){
	Page.findOneAndRemove({_id: req.params.id})
	.then(function(response){
		res.send(response);
	}, next);
});

module.exports = router;

