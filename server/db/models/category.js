var mongoose = require('mongoose');

var schema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['public', 'private']
    },
    description: {
        type: String
    },
    pages: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'Page'
    }],
    admin: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    },
    subscribers: [ {type: mongoose.Schema.Types.ObjectId, ref: 'User'} ] 
});

schema.pre('save', function (next) {

    //To-Do: Name changes only allowed for folders - DELETE en route
    
    if(this.isNew){
        //Automatically subscribe admin to list.
        this.subscribers.push(this.admin);

        //If category is public (i.e. 'Subscription'), make sure name is unique. 
        if(this.type === 'public'){
           this.constructor.count({type: 'public', description: this.description})
           .then(function(count){
               if(count > 0) next(new Error('Subscription with name ${this.type} already exists.'))
           })
        }
    }else{
        if(this.type === 'private' && this.subscribers.length > 1){
            next(new Error('Users cannot subscribe to private folders.'));
        }
    }
    
    next();
});

//Optimize 'find by subscriber' queries 
schema.index({subscribers: 1});

mongoose.model('Category', schema);