const { default: mongoose } = require("mongoose");
const Favourite = require("../models/faouriteCartModel");
const NewPost = require("../models/postModel");
const Reels = require("../models/reelModel");
const ShopDetails = require("../models/shopModel");
const ShopReview = require("../models/shopReviewModel");
const User = require("../models/userModel");
const calculateAverageRating = require("../utils/calculateRating");
 


 

// Get all favorite items with filtering
const getFavoriteItems = async (req, res) => {
    try {
        const { userId } = req.params;
        const { type } = req.query;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
              success: false,
              message: "Invalid User ID format.",
            });
          }

        let favorite = await Favourite.findOne({ userId })
            .populate({ path: "likedVideos", select: "videoUrl views caption" })
            .populate({ path: "likedProducts", select: "imageUrl shopId location caption address", populate: { path: "shopId", select: "shopName" } })
            .populate({ path: "likedShops", select: "posts shopName shopLocation address" });
        
        if (!favorite) {
            return res.status(200).json({ message: "No favorite record found",data:[] ,success: true });
        }

        let response = {};

        if (!type || type === "all") {
            response = {
                likedProducts: favorite.likedProducts,
                likedShops : await Promise.all(favorite.likedShops.map(async (shop) => {
                    const rating = await calculateAverageRating(shop._id )
                    const posts = await NewPost.find({ shopId: shop._id });
                    return { ...shop.toObject(), posts,shopAverageRating:rating.averageRating,shopReviewCount:rating.reviewCount };
                })),
                likedVideos: favorite.likedVideos
            };
        } else if (type === "products") {
            response.likedProducts = favorite.likedProducts;
        } else if (type === "shops") {
            response.likedShops = await Promise.all(favorite.likedShops.map(async (shop) => {
                const rating = await calculateAverageRating(shop._id )
                const posts = await NewPost.find({ shopId: shop._id });
                return { ...shop.toObject(), posts,shopAverageRating:rating.averageRating,shopReviewCount:rating.reviewCount };
            }));
        } else if (type === "videos") {
            response.likedVideos = favorite.likedVideos;
        } else {
            return res.status(400).json({ message: "Invalid filter type", success: false });
        }

        res.status(200).json({ success: true, data: response });
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message: error.message, success: false });
    }
};
// Add favorite item (product, shop, or video)
const addFavoriteItem = async (req, res) => {
    try {
        const { userId, itemId, type } = req.body;



        if(!userId || !itemId || !type){
            return res.status(400).json({
                message:'all fields are required',
                success:false
            })
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid User ID format.",
        });
      }

      if (!mongoose.Types.ObjectId.isValid(itemId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid item ID format.",
        });
      }

        const user = await User.findById(userId)

        if(!user){
            return res.status(400).json({
                message: 'user not found',
                success:false
            })
        }
        let favorite = await Favourite.findOne({ userId });

        if (!favorite) {
            favorite = new Favourite({ userId, likedProducts: [], likedShops: [], likedVideos: [] });
        }
     

        if (type === "products" && !favorite.likedProducts.includes(itemId)) {
            const post = await NewPost.findById(itemId)

            if(!post){
                return res.status(400).json({
                    message:'product not found',
                    success:false,
                })
            }
            favorite.likedProducts.push(itemId);
        } else if (type === "shops" && !favorite.likedShops.some(shop => shop.equals(itemId))) {
            const shop = await ShopDetails.findById(itemId)

            if(!shop){
                return res.status(400).json({
                    message:'shop not found',
                    success:false,
                })
            }
            favorite.likedShops.push(itemId);
        } else if (type === "videos" && !favorite.likedVideos.includes(itemId)) {
            const video = await Reels.findById(itemId)

            if(!video){
                return res.status(400).json({
                    message:'video not found',
                    success:false,
                })
            }
            favorite.likedVideos.push(itemId);
        } else {
            return res.status(400).json({ message: `${type} is already in favorites`, success: false });
        }

        await favorite.save();
        res.status(201).json({ message: `${type} added to favorites`, success: true, favorite });
    } catch (error) {
        res.status(500).json({ message: error.message, success: false });
    }
};

// Remove favorite item (product, shop, or video)
const removeFavoriteItem = async (req, res) => {
    try {
        const { userId, itemId } = req.params;
        const {type} = req.body
        const favorite = await Favourite.findOne({ userId });
      
        if(!userId || !itemId || !type){
            return res.status(400).json({
                message:'all fields are required',
                success:false
            })
        }

        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(400).json({
              success: false,
              message: "Invalid itemId format.",
            });

          }

          if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
              success: false,
              message: "Invalid User ID format.",
            });
          }

        const user = await User.findById(userId)

        if(!user){
            return res.status(400).json({
                message: 'user not found',
                success:false
            })
        }
        if (!favorite) {
            return res.status(404).json({ message: "No favorite record found", success: false });
        }

        if (type === "products") {
            const post = await NewPost.findById(itemId)

            if(!post){
                return res.status(400).json({
                    message:'product not found',
                    success:false,
                })
            }
            favorite.likedProducts = favorite.likedProducts.filter(product => !product.equals(itemId));
        } else if (type === "shops") {
            const shop = await ShopDetails.findById(itemId)

            if(!shop){
                return res.status(400).json({
                    message:'shop not found',
                    success:false,
                })
            }
            favorite.likedShops = favorite.likedShops.filter(shop => !shop.equals(itemId));
        } else if (type === "videos") {
            const video = await Reels.findById(itemId)

            if(!video){
                return res.status(400).json({
                    message:'video not found',
                    success:false,
                })
            }
            favorite.likedVideos = favorite.likedVideos.filter(video => !video.equals(itemId));
        } else {
            return res.status(400).json({ message: "Invalid type", success: false });
        }

        await favorite.save();
        res.status(200).json({ message: `${type} removed from favorites`, success: true, favorite });
    } catch (error) {
        res.status(500).json({ message: error.message, success: false });
    }
};


module.exports= {getFavoriteItems,addFavoriteItem,removeFavoriteItem}
