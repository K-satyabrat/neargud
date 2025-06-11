const mongoose = require('mongoose');
 
const shopDetailsSchems =  new mongoose.Schema({
    shopkeeperId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    bannerImage:{
      type:String,
      default:null,
    },
    shopName: {
        type: String,
        required: true
    },
    shopLocation: {
        type: { type: String, enum: ['Point'],  }, 
        coordinates: { type: [Number], index: '2dsphere' }  
    },
    regularOffer: {
        type: String,
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
    contactNumber: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        default:null
    },
    address:{
        type:String,
        default:null
    },
     likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User",   default:[] }],
        visitors:[
             {
                 visitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  
                 addedAt: { type: Date, default: Date.now }  
             }
         ],
         engagement: [
             {
                 userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },  
                 engagementType: { type: String, enum: ['like', 'follow'] },  
                 engagementAt: { type: Date, default: Date.now }  
             }
         ],
         bio: {
            type: String,
            default: ""
        },
},{timestamps:true});
 
const ShopDetails =  mongoose.model('ShopDetails',shopDetailsSchems);
module.exports =ShopDetails;