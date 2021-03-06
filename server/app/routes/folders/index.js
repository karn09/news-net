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

//Shortcut for below
router.get('/user/me', function(req, res, next){

  var field = '';
  if(req.query.long) field = 'pages'
    
  Category.find({type: type, subscribers: req.session.passport.user})
  .populate(field)
  .then(function(folders){
    res.send(folders);
  }, next)
})

//Admin or self
router.get('/user/:userId', function(req, res, next){
	Category.find({type: type, subscribers: req.params.userId})
	.then(function(folders){
		res.send(folders);
	}, next)
})


//Admin or owner
router.get('/:id', function(req, res, next){
  Category.findById(req.params.id)
  .then(function(folder){
  	res.send(folder);
  }, next)
});

//Logged in user
router.post('/', function(req, res, next){
  var pages = [];
  if(req.body.page) pages.push(req.body.page);

  var category = new Category({
  	type: type,
  	description: req.body.description,
  	pages: pages,
  	admin: req.session.passport.user
  })

  category.save()
  .then(function(folder){
    console.log("folder", folder)
   	res.send(folder)
  }, next);

});

//Admin or owner
router.put('/:id', function(req, res, next){
  Category.findById(req.params.id)
  .then(function(folder){
  	if(req.body.page) folder.pages.push(req.body.page);
  	if(req.body.pages) folder.pages = folder.pages.concat(req.body.pages);
  	return folder.save();
  })
  .then(function(updatedFolder){
  	res.send(updatedFolder);
  }, next);
});

// Category.admin
router.delete('/:id/pages/:pageId', function(req, res, next){
  Category.findById(req.params.id)
  .then(function(folder){
    var pageIndex = folder.pages.indexOf(req.params.pageId);
    folder.pages.splice(pageIndex, 1)
    return folder.save();
  })
  .then(function(updatedFolder){
    res.send(updatedFolder);
  })
})

//Admin or owner
//Hard Delete
router.delete('/:id', function(req, res, next){
	Category.findByIdAndRemove(req.params.id)
	.then(function(deletedFolder){
		res.send(deletedFolder);
	})
})