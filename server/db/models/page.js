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
        type: String, set: setImg, default: '/assets/images/news.jpg'
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

function setImg(v) {
    if (v === null ) return '/assets/images/news.jpg';
    return v;
}

mongoose.model('Page', schema);
