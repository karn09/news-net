'use strict';
var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');
var Category = mongoose.model('Category');


router.get('/', function(req, res, next){
    Category.find({})
        .populate(['page', 'user'])
        .then(function(categories){
            res.json(categories);
        }, next);
});


router.get('/:id', function(req, res, next){
    Category.find({_id: req.params.id})
        .populate(['page', 'user'])
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
