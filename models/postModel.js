const mongoose = require('mongoose');
 
const newPostSchema = new mongoose.Schema({
    shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ShopDetails',
        required: true
    },
    imageUrl: {
        type: [String],
        required: true
    },
    caption: {
        type: String,
        required: false,
        default:null
    },
    description: {
        type: String,
        required: true,
    },
    originalPrice:
        {
            type: Number,
            required: false,
            default:null
    },
    price: {
        type: Number,
        required: false,
        default:null
    },
    location:  {
        type: { type: String, enum: ['Point'], required: true }, 
        coordinates: { type: [Number], required: true, index: '2dsphere' } 
    },
    category: {
        type: String,
        required: true
    },
    subCategory: {
        category:{
            type:String,
        },
        subCategory:{
            type:String,
        }
    },
    viewers:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        default:[]
    }],
    address:{
        type:String,
        default:null
    },
    discount:{
        type:Number,
        default:0,
    },
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User",   default:[] }]
}, { timestamps: true });
 
const NewPost = mongoose.model('NewPost', newPostSchema);
module.exports = NewPost;