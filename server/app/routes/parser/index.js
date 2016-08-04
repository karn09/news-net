'use strict';
var router = require('express').Router();
var secrets = require('../../../../secrets.js')
module.exports = router;

var readability = require('readability-api');
readability.configure(secrets.readability);

// Create a parser object
var parser = new readability.parser();


router.get('/:url', function(req, res, next){
	parser.parse(req.params.url, function (err, parsed) {
	  res.json(parsed);
	});
});





module.exports = router;
