'use strict';
var router = require('express').Router();
module.exports = router;

router.use('/members', require('./members'));

router.use('/comments', require('./comments'));
router.use('/users', require('./users'));
router.use('/parser', require('./parser'));
router.use('/pages', require('./pages'));

// Make sure this is after all of
// the registered routes!
router.use(function (req, res) {
    res.status(404).end();
});
