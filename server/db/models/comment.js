var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    },
    page: {
        type: mongoose.Schema.Types.ObjectId, ref: 'Page'
    },
    text: {
    	type: String
    },
    dateStamp: {
        type: Date
    }
});


mongoose.model('Comment', schema);
