'use strict';
var router = require('express').Router();
module.exports = router;
var mongoose = require('mongoose');
var Category = mongoose.model('Category');
var User = mongoose.model('User');

var type = 'private';

//Admin 
router.get('/', function(req, res, next){
	Category.find({type: type})
	.then(function(folders){
		res.send(folders);
	}, next)
});

//Admin or self
router.get('/user/:userId', function(req, res, next){
	Category.find({subscribers: req.params.userId})
	.then(function(folders){
		res.send(folders);
	})
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