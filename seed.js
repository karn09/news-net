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
            type: 'public',
        },
    ];
    return Category.create(categories);
}

var seedPages = function(){
    var pages = [
        {
            title: 'Fake Article',
            url: 'http://www.google.com',
            leadImageUrl: 'http://apiw.org/wp-content/uploads/2014/10/news.jpg',
            excerpt: "This is a fake article",
            content: "This is a fake article. I am using it to test some features of the site. Its category is 'Technology'." 
        },
        {
            title: "Another Fake One",
            url: 'http://www.google.com',
            leadImageUrl: 'http://apiw.org/wp-content/uploads/2014/10/news.jpg',
            excerpt: "This is the second fake article",
            content: "This is a fake article. I am using it to test some features of the site. It has no category."
        }
    ]

    return Category.findOne({description: 'Technology'})
    .then(function(category){
        return Page.create(pages)
        .then(function(pages){
            console.log("\n\nPages: ", pages, "\n\n Category: ", category)
            category.pages.push(pages[0]);
            return category.save();
        })
    })
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
    .then(function(){
        return seedPages();
    })
    .then(function () {
        console.log(chalk.green('Seed successful!'));
        process.kill(0);
    })
    .catch(function (err) {
        console.error(err);
        process.kill(1);
    });
