var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    content: {
    	type: String
    },
    datePublished: {
        type: String
    },
    domain: {
        type: String
    },
    excerpt: {
        type: String
    },
    leadImageUrl: {
        type: String
    },
    title: {
        type: String
    },
    url: {
        type: String
    },
    userCount: {
        type: Number
    }
});


mongoose.model('Page', schema);
