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
    subscribers: {
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    }
});

schema.pre('save', function (next) {

    //To-Do: Name changes only allowed for folders - DELETE en route
    
    if(this.isNew){
        //Automatically subscribe admin to list.
        this.subscribers.push(this.admin);

        //If category is public (i.e. 'Subscription'), make sure name is unique. 
        if(this.type === 'public'){
           Category.count({type: 'public', description: this.description})
           .then(function(count){
               if(count > 0) next(new ValidationError('Subscription with name ${this.type} already exists.'))
           })
        }
    }else{
        if(this.type === 'private' && this.subscribers.length > 1){
            next(new ValidationError('Users cannot subscribe to private folders.'));
        }
    }
    
    next();
});

mongoose.model('Category', schema);