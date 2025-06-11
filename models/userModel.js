const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        userPhoneNumber: {
            type: String,  
            required: true,
            unique: true
        },
        accountType: {
            type: String,
            enum: ['customer', 'business'],
            default: 'customer'
        },
        location:  {
            type: { type: String, enum: ['Point'],   }, 
            coordinates: { type: [Number], index: '2dsphere' } 
        },
        name: {
            type: String,
            default:null
        },
        image: {
            type:String,
            default:null
        },
        userName: {
            type: String,
            default:null
        },
        gender: {
            type: String,
            enum: ["male", "female", "other"],
            default:null
        },
        email: {
            type: String,
            default:null
        },
        bio: {
            type: String,
            default: ""
        },
        address:{
            type:String,
            default:null
        }
    },
    { timestamps: true }
);

const User = mongoose.model('User', userSchema);

module.exports = User;
