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
//Usage: /api/pages/category?id=<Category ID> or ?name=<Category Name>. If both, will ignore name.
router.get('/category/', function(req, res, next){

    if(req.query.id){

        Category.findById(req.query.id)
        .populate(['pages'])
        .then(function(category){
            if(category){
                res.send(category.pages);  
            }else{
                res.send("Category with id: " + req.query.id + " not found.")
            } 
        })

    }else if(req.query.name){

        Category.findOne({description: req.query.name})
        .populate(['pages'])
        .then(function(category){
            if(category){
                res.send(category.pages);  
            }else{
                res.send("Category with name: " + req.query.name + " not found.")
            } 
        })

    }else{
        res.send("Please provide a category name or ID.")
    }
})

//Get page by ID
router.get('/:id', function(req, res, next){
	Page.findById(req.params.id)
	.then(function(page){
		res.json(page);
	}, next);
});

//Post article - used by chrome extension
router.post('/ext', function(req, res, next){

  console.log("req.body: ", req.body.title);



  var user = 'obama@gmail.com';
  User.findOne({email: user})
    .then(function(user){
      Page.findOne({url: req.body.url})
        .then(function(page){
          if (page) {
            console.log("Page already exists:\n", page);
            page.userCount = page.userCount + 1; console.log("Updated userCount is ", page.userCount);
            page.save()
              .then(function(updatedPage){
                console.log("user", user)
                user.pages.push(updatedPage._id);
                if(req.body.category){
                  Category.findOne({description: req.body.category})
                    .then(function(category){
                      category.pages.push(updatedPage._id);
                      return category.save()
                    }).then(function(){
                    return user.save()
                  }).then(function(){
                    res.send(updatedPage);
                  })
                }else{
                  user.save()
                    .then(function(response){
                      res.send(updatedPage);
                    })
                }
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
                console.log("Created new page:\n", page);
                user.pages.push(page._id);
                if(req.body.category){
                  Category.findOne({description: req.body.category})
                    .then(function(category){
                      category.pages.push(page._id);
                      return category.save()
                    }).then(function(){
                    return user.save()
                  }).then(function(){
                    res.send(page);
                  })
                }else{
                  user.save()
                    .then(function(response){
                      res.send(page);
                    })
                }
              })
          }
        })
    })



});

//Post article
//Optional body param: 'category'
router.post('/', function(req, res, next){
    var sessionUserId = req.session.passport.user;
    User.findById(sessionUserId)
    .then(function(user){
        Page.findOne({url: req.body.url})
        .then(function(page){
            if (page) {
                console.log("Page already exists:\n", page);
                page.userCount = page.userCount + 1; console.log("Updated userCount is ", page.userCount);
                page.save()
                .then(function(updatedPage){
                    console.log("user", user)
                    user.pages.push(updatedPage._id);
                    if(req.body.category){
                       Category.findOne({description: req.body.category})
                        .then(function(category){
                            category.pages.push(updatedPage._id);
                            return category.save()
                        }).then(function(){
                            return user.save()
                        }).then(function(){
                            res.send(updatedPage);
                        })
                    }else{
                        user.save()
                        .then(function(response){
                            res.send(updatedPage);
                        }) 
                    }  
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
                    console.log("Created new page:\n", page);
                    user.pages.push(page._id);
                    if(req.body.category){
                        Category.findOne({description: req.body.category})
                        .then(function(category){
                            category.pages.push(page._id);
                            return category.save()
                        }).then(function(){
                            return user.save()
                        }).then(function(){
                            res.send(page);
                        })
                    }else{
                        user.save()
                        .then(function(response){
                            res.send(page);
                        })
                    }
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

