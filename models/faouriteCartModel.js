const mongoose = require('mongoose');
 
const favouriteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    likedProducts: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'NewPost',
            default:[]
        }
    ],
    likedShops: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ShopDetails',
            default:[]
        }
    ],
    likedVideos: [
         {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Reels',
            default:[]
        }
    ]
}, { timestamps: true });
 
const Favourite = mongoose.model('Favourite', favouriteSchema);
module.exports = Favourite;