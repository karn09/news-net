'use strict';
var router = require('express').Router();
module.exports = router;

var readability = require('readability-api');

readability.configure({
    consumer_key: 'ontima',
    consumer_secret: 'D3d3qjF22SpWTzGLQAjJs9VeQtfFFVFU',
    parser_token: 'a39d4eda19236cb88d0ac6cb68c579a3d04c65c4'
});

// Create a parser object
var parser = new readability.parser();


router.get('/:url', function(req, res, next){
	//console.log("url: ", req.params.url);
	parser.parse(req.params.url, function (err, parsed) {
	  res.json(parsed);
	});

});





module.exports = router;
