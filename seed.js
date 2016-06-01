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

var wipeCollections = function () {
    var removeUsers = User.remove({});
    var removeComments = Comment.remove({});
    return Promise.all([
        removeUsers, removeComments
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

var seedComments = function() {
    var comments; 
    return User.findOne({email: 'obama@gmail.com'}).exec()
    .then(function(user){
        comments = [
            {
                user: user._id,
                text: "awesome article",
                dateStamp: Date.now()
            },
            {
                user: user._id,
                text: "can't agree more",
                dateStamp: Date.now()
            }
        ]
        return Comment.create(comments);
    })
};




connectToDb
    .then(function () {
        return wipeCollections();
    })
    .then(function () {
        return seedUsers();
    })
    .then(function(){
        return seedComments();
    })
    .then(function () {
        console.log(chalk.green('Seed successful!'));
        process.kill(0);
    })
    .catch(function (err) {
        console.error(err);
        process.kill(1);
    });
