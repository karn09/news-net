'use strict';
var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');
var Category = mongoose.model('Category');

var type = 'public';

//Admin 
router.get('/', function(req, res, next){
  	Category.find({type: type})
	.then(function(subscriptions){
		res.send(subscriptions);
	})
});

//Admin or self
router.get('/user/:id', function(req, res, next){

})

//Shortcut for above
router.get('/user/me', function(req, res, next){

})

//Admin, owner, or subscriber
router.get('/:id', function(req, res, next){
  
});

//Logged in user
router.post('/', function(req, res, next){
  
});


//Admin or owner
router.put('/:id', function(req, res, next){
  
});

//Admin or owner
router.delete('/:id', function(req, res, next){

})