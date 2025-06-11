const mongoose = require('mongoose')

const followerSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        require:true
    },
    followers:[
        {
            followerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  
            addedAt: { type: Date, default: Date.now }  
        }
    ],
},
{
    timestamps:true
}
)

const Follower = mongoose.model('Follower',followerSchema)

module.exports= Follower

