var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    description: {
         type: String
    },
    pages: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'Page'
    }],
    type: {
        type: String,
        enum: ['public', 'private']
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    }
});


mongoose.model('Category', schema);