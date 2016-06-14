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
    votes : {
        type: [ 
            {
                userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
                vote:  {type: Number, enum: [-1, 1]}
            }
        ]
    },
    dateStamp: {
        type: Date, default: Date.now()
    },
    dateEdited: {
        type: Date
    }
}, {toObject: { virtuals: true }, toJSON: { virtuals: true }});

schema.pre('save', function (next) {
    //Automatically upvote self
    if(this.isNew){
        var selfVote = {
            userId: this.user,
            vote: 1
        }

        delete selfVote._id;
        this.votes.push(selfVote);
    }
    
    next();
});

// schema.post('save', function(){
//     console.log("Vote Count: ", this.voteCount);
// })

schema.virtual('voteCount').get(function(){
    var count = 0;
 
    this.votes.forEach(function(vote){
        count += vote.vote;
    })

    return count;
})

//Would normally just set select: false on votes field.
//However, field is required by calculations in schema virtual 'voteCount'.
//We want to expose voteCount, which relies on 'votes', but discard that data before sending out response.
schema.methods.toJSON = function(options){
    var document = this.toObject(options);
    delete(document.id);
    delete(document.votes);
    return document;
}

schema.set('toJSON', { virtuals: true });

mongoose.model('Comment', schema);
