/*

This seed file is only a placeholder. It should be expanded and altered
to fit the development of your application.

It uses the same file the server uses to establish
the database connection:
--- server/db/index.js

The name of the database used is set in your environment files:
--- server/env/*

This seed file has a safety check to see if you already have users
in the database. If you are developing multiple applications with the
fsg scaffolding, keep in mind that fsg always uses the same database
name in the environment files.

*/

var mongoose = require('mongoose');
var Promise = require('bluebird');
var chalk = require('chalk');
var connectToDb = require('./server/db');
var User = mongoose.model('User');
var Comment = mongoose.model('Comment');
var Page = mongoose.model('Page');
var Category = mongoose.model('Category');

var wipeCollections = function () {
    var removeUsers = User.remove({});
    var removeComments = Comment.remove({});
    var removePages = Page.remove({});
    var removeCategories = Category.remove({});

    return Promise.all([
        removeUsers, removeComments, removePages, removeCategories
    ]);
};

var seedUsers = function () {

    var users = [
        {
            email: 'testing@fsa.com',
            password: 'password'
        },
        {
            email: 'obama@gmail.com',
            password: 'potus'
        }
    ];

    return User.create(users);

};

var seedCategories = function() {

    var categories = [
        {
            description: 'Sports',
            type: 'public'
        },
        {
            description: 'Arts',
            type: 'public'
        },
        {
            description: 'Technology',
            type: 'public'
        },
    ];
    return Category.create(categories);
}


connectToDb
    .then(function () {
        return wipeCollections();
    })
    .then(function () {
        return seedUsers();
    })
    .then(function () {
        return seedCategories();
    })
    .then(function () {
        console.log(chalk.green('Seed successful!'));
        process.kill(0);
    })
    .catch(function (err) {
        console.error(err);
        process.kill(1);
    });
