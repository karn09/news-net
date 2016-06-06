'use strict';
var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');
var Category = mongoose.model('Category');


router.get('/', function(req, res, next){
    Category.find({})
        .populate('pages')
        .then(function(categories){
            res.json(categories);
        }, next);
});


router.get('/:id', function(req, res, next){
    Category.findById(req.params.id)
        .populate('pages')
        .then(function(category){
            res.json(category);
        }, next);
});


router.post('/', function(req, res, next){
    var newCategory = new Category({
        description: req.body.description,
        pages: req.body.pages,
        type: req.body.type,
        admin: req.body.userid
    });
    newCategory.save()
        .then(function(response){
            res.send(response);
        });
});

//Add existing page to category
router.put('/addPage/:id', function(req, res, next){
   Category.findOne({_id: req.params.id})
       .then(function(category){
         //console.log("put category addPage route: ", category);
         category.pages.push(req.body.page);
           return category.save();
       })
       .then(function(response){
           res.send(response);
       })
});


router.delete('/:id', function(req, res, next){
    Category.findOneAndRemove({_id: req.params.id})
        .then(function(response){
            res.send(response);
        }, next);
});

module.exports = router;
