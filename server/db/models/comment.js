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
        ],
        select: false
    },
    dateStamp: {
        type: Date, default: Date.now()
    },
    dateEdited: {
        type: Date
    }
});

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

schema.post('save', function(){
    console.log("VOTE COUNT", this.voteCount);
})

schema.virtual('voteCount').get(function(){
    var count = 0;
    this.votes.forEach(function(vote){
        count += vote.vote;
    })

    return count;
})

mongoose.model('Comment', schema);
