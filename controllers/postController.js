const { default: mongoose } = require("mongoose");
const NewPost = require("../models/postModel");
const ShopDetails = require('../models/shopModel');
const ShopReview = require("../models/shopReviewModel");
const calculateAverageRating = require("../utils/calculateRating");
const getCoordinatesFromAddress = require("../utils/getLocationCoordinate");
const SubscriptionPlan = require("../models/subscriptionModel");
const Favourite = require("../models/faouriteCartModel");
const User = require("../models/userModel");
const cloudinary = require("cloudinary").v2;
 
 

const createPost = async (req, res) => {
    try {
        const { shopId, caption, description,subCategory, price, location, category ,discount=0} = req.body;
 
        if (!shopId || !description || !category || !location) {
            return res.status(400).json({ message: 'Missing required fields', success: false });
        }
        let imageUrl = [String];
        if (req.files) {
            imageUrl = req.files.image.map((file) => file.path);
        }
        const shop = await ShopDetails.findById(shopId).select('shopkeeperId')

        if(!shop){
          return res.status(400).json({
            message:'shop not found',
            success:false,
          })
        }

        const subscription = await SubscriptionPlan.findOne({shopId:{$in :[shopId]}})

        if(!subscription){
          return res.status(400).json({
            message:"you do not have subscription to add post",
            success:false
          })
        }
      let currentDate = new Date()
      let expireDate = new Date(subscription.endDate);
        const isSubscriptionExpired = expireDate<currentDate

        if(isSubscriptionExpired){
          return res.status(400).json({
            message:"your subscription has expired",
            success:false
          })
        }

        const locationData = await getCoordinatesFromAddress(location)

        if(!locationData){
          return res.status(400).json({
            message:"invalid address",
            success:false,
          })
        }
      
        let originalPrice = price; // No need for a ternary check
        let updatedPrice = null;
        
        if (price) {
          let discountAmount = parseFloat(price) * (parseFloat(discount) / 100);
          updatedPrice = parseFloat(price) - discountAmount;
        }
        
        let updaetdSubcategory = null

        if(subCategory){
          if(subCategory.category){
            updaetdSubcategory = {category: subCategory.category.toLowerCase()};
            if(subCategory.subCategory){
              updaetdSubcategory.subCategory = subCategory.subCategory.toLowerCase();
            }
          }
        }
     

        const newPost = new NewPost({
            shopId,
            imageUrl,
            caption:caption.toLowerCase(),
            description,
            originalPrice,
            price:updatedPrice,
            location: { type: 'Point', coordinates: [parseFloat(locationData.longitude), parseFloat(locationData.latitude)] },
            category:category.toLowerCase(),
            subCategory:updaetdSubcategory?updaetdSubcategory:null,
            address:location,
            discount,
        });
 
        await newPost.save();
        res.status(201).json({ message: 'Post created successfully', success: true, data: newPost });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message:  `Internal Server Error ${error.message}`, success: false });
    }
};
 
const updatePost = async (req, res) => {
    try {
        const { postId} = req.params;
        const { caption, description, price,subCategory, category ,location,discount} = req.body;
        let imageUrl = []; // Initialize as an empty array

if (req.files && req.files.image) {
    imageUrl = req.files.image.map((file) => file.path); // Directly assign the mapped array
}

 

        const post = await NewPost.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found', success: false });
        }
        let locationData = null
        if(location){
        locationData = await getCoordinatesFromAddress(location)
        }

        if(!locationData){
          return res.status(400).json({
            message:"invalid address",
            success:false,
          })
        }
        console.log("address",location)
        if (imageUrl ){
          //delete old images from cloudinary
          post.imageUrl.map(async (item) => {
            await cloudinary.uploader.destroy(item.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/")); 
          });
          
           post.imageUrl=imageUrl;
        }
        if (caption) post.caption = caption.tpLowerCase();
        if (description) post.description = description;
        if (price) post.price = price;
        if (locationData) {
            post.address=location,
          post.location ={ type: 'Point', coordinates: [parseFloat(locationData.longitude), parseFloat(locationData.latitude)] }
        }
        if (category !== undefined) post.category = category.toLowerCase();
        if (subCategory !== undefined){
         let updaetdSubcategory =null
         if(subCategory.category){
           updaetdSubcategory = {category: subCategory.category.toLowerCase()};
            if(subCategory.subCategory){
              updaetdSubcategory.subCategory = subCategory.subCategory.toLowerCase();
            }
          }
          post.subCategory=updaetdSubcategory?updaetdSubcategory:null;
         }
        if(discount) post.discount=discount;
 
        await post.save();
        res.status(200).json({ message: 'Post updated successfully', success: true, data: post });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message:  `Internal Server Error ${error.message}`, success: false });
    }
};
 
const getAllPosts = async (req, res) => {
    try {
      const {userId}=req.params
        const{isTopProduct,category,searchTitle,latitude,longitude, limit = 10, page = 1 } = req.query;
        const currentPage = parseInt(page);
         
        if (!userId) {
          return res.status(400).json({ message: "User ID is required",success:false });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({
            success: false,
            message: "Invalid   userId format.",
          });
        }

        const user = await User.findById(userId)

        if(!user){
          return res.status(404).json({
            message:'user not found',
            success:false
          })
        }
        const query = [];

        if (latitude && longitude) {
            query.push({
              $geoNear: {
                near: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] }, // Ensure correct order: [longitude, latitude]
                distanceField: "distance",
                maxDistance: 10000,   
                spherical: true,
              },
            });
          } else {
            query.push({ $match: {} }); // Dummy match to avoid errors
          }
          if (category) {
            query.push({
              $match: {
                $or: [
              { category: category.toLowerCase() },
              { "subCategory.category": category.toLowerCase() },
              { "subCategory.subCategory": category.toLowerCase() },
                ]
              }
            });
              }
        if(searchTitle   &&  searchTitle!=="false" && searchTitle !== "undefined" && searchTitle !== "null"){
          function escapeRegex(text) {
            return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
          }
           
          const searchTitleEscaped = escapeRegex(searchTitle.toLowerCase());
          
          query.push({
            $match: {
              $or: [
                { caption: { $regex: searchTitleEscaped, $options: "i" } },
                { category: { $regex: searchTitleEscaped, $options: "i" } },
                { "subCategory.category": { $regex: searchTitleEscaped, $options: "i" } },
                { "subCategory.subCategory": { $regex: searchTitleEscaped, $options: "i" } },
                { description: { $regex: searchTitleEscaped, $options: "i" } }
              ]
            }
          });
        }

          if (isTopProduct === "true") {
            query.push(
              {
                $lookup: {
                  from: "subscriptionplans",
                  localField: "shopId",
                  foreignField: "shopId",
                  as: "subscription",
                },
              },
              {
                $addFields: {
                  subscriptionPlan: { $arrayElemAt: ["$subscription.subscriptionPlan", 0] },
                  features: { $arrayElemAt: ["$subscription.features", 0] },
                  endDate: { $arrayElemAt: ["$subscription.endDate", 0] },
                },
              },
              {
                $addFields: {
                  isTopListed: {
                    $cond: {
                      if: {
                        $and: [
                          { 
                            $or: [
                              { $in: ["top10List", { $ifNull: ["$features", []] }] },
                              { $in: ["guaranteedTopVisibility", { $ifNull: ["$features", []] }] }
                            ]
                          },
                          { $gt: ["$endDate", new Date()] }  
                        ],
                      },
                      then: true,
                      else: false,
                    },
                  },
                },

              },
              {
                $addFields: {
                  is1xvisibility: {
                    $cond: {
                      if: {
                        $and: [
                          { $in: ["Search Visibility: 1x", "$features"] },
                          { $gt: ["$endDate", new Date()] }
                        ],
                      },
                      then: true,
                      else: false,
                    },
                  },
                },
              },
              {
                $addFields: {
                  is3xvisibility: {
                    $cond: {
                      if: {
                        $and: [
                          { $in: ["Search Visibility: 3x", "$features"] },
                          { $gt: ["$endDate", new Date()] }
                        ],
                      },
                      then: true,
                      else: false,
                    },
                  },
                },
              },
              {
                $addFields: {
                  isGuaranteedTopVisibility: {
                    $cond: {
                      if: {
                        $and: [
                          { $in: ["guaranteedTopVisibility", "$features"] },
                          { $gt: ["$endDate", new Date()] }
                        ],
                      },
                      then: true,
                      else: false,
                    },
                  },
                },
              }
            );
            query.push({
              $match: {
                isTopListed: true,
              },
            });
          }
      
          query.push(
            {
              $lookup: {
                from: "shopdetails",
                localField: "shopId",
                foreignField: "_id",
                as: "shop",
              },
            },
            {
              $addFields: {
                shopName: { $arrayElemAt: ["$shop.shopName", 0] },
                
              },
            },
           
          );
          
          const sortStage = {
            $sort: {
              isTopListed: -1,  
            },
          };

          if (latitude && longitude) {
            sortStage.$sort.distance = 1;
          }

          if (searchTitle) {
            sortStage.$sort.isGuaranteedTopVisibility=-1;
            sortStage.$sort.is3xvisibility = -1;
            sortStage.$sort.is1xvisibility = -1;
          }
            query.push(sortStage);

            query.push({
                $project:{
                    imageUrl:1,
                    caption:1,
                    description:1,
                    price:1,
                    location:1,
                    category:1,
                    shopId:1,
                    isTopListed:1,
                    viewers:1,
                    shopName:1,
                    likes:1,
                    discount:1,
                    address:1,
                }
            })
        
            const posts = await NewPost.aggregate(query)
            .sort({ createdAt: -1 })
            .skip((parseInt(page) - 1) * parseInt(limit))
            .limit(parseInt(limit));
            const totalPage = Math.ceil(posts.length / parseInt(limit));
           
            const updatedPosts = posts.map((post)=>{
              const isLiked = post.likes?.some((id) => id.toString() === userId.toString());
               const shareableLink = `${process.env.BASE_URL || 'https://neargud-be.onrender.com'}/api/user/post/getPostById/${post._id}`
              return {...post,isLiked,shareableLink}
            })
            return res.status(200).json({
              success: true,
              data:updatedPosts,
              currentPage,
              totalRecords:posts.length,
              totalPage,
              hasNextPage: currentPage < totalPage,
              hasPrevPage: currentPage > 1,
              page: parseInt(page),
            });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message:  `Internal Server Error ${error.message}`, success: false });
    }
};

const getPostById = async (req, res) => {
    try {
        const { postId,userId} = req.params;
        const post = await NewPost.findById(postId);
       
          
        if (!userId || !postId) {
          return res.status(400).json({ message: "UserId and postId is required",success:false });
        }

        const user = await User.findById(userId)

        if(!user){
          return res.status(404).json({
            message:'user not found',
            success:false
          })
        }
        
 
        if (!post) {
            return res.status(404).json({ message: 'Post not found', success: false });
        }
        const shop = await ShopDetails.findById(post.shopId)
        const shopReview = await ShopReview.findOne({shopId:post.shopId})
        const posts = await NewPost.find({shopId:post.shopId}).sort({createdAt:-1}).select("imageUrl caption")

        if(!shop){
          return res.status(400).json({message:"shop not found", success:false})
        }
        let shopAverageRating=5.0
        let shopReviewCount=0
        if(shopReview){
          rating = await calculateAverageRating(post.shopId)
          shopAverageRating = rating.averageRating
          shopReviewCount = rating.reviewCount
        }
        const isLiked = post.likes.includes(userId)
        const shareableLink = `${process.env.BASE_URL || 'https://neargud-be.onrender.com'}/api/user/post/getPostById/${post._id}`
        let data = {...post.toObject()}
        data["shopLocation"] = shop?.shopLocation
        data["shopPosts"] = posts
        data["shopAverageRating"] = shopAverageRating
        data["shopReviewCount"] = shopReviewCount
        data["shareableLink"] = shareableLink
        data["isLiked"] = isLiked
        data['shopOwnerId']= shop.shopkeeperId

        await NewPost.findByIdAndUpdate(postId, {
          $inc: { views: 1 },
          $addToSet: { viewers: userId },  
        });
        res.status(200).json({ message: 'Post fetched successfully', success: true, data: data });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message:  `Internal Server Error ${error.message}`, success: false });
    }
}

const getPostsByShopId = async (req, res) => {
    try {
        const { shopId } = req.params;
        const posts = await NewPost.find({ shopId }).select('imageUrl viewers');
 
        if (!posts) {
            return res.status(404).json({ message: 'Posts not found', success: false });
        }
        const updatedPosts= posts.map((post)=>{
          const totalViews = post.viewers.length
          return {...post.toObject(),totalViews}
        })
        res.status(200).json({ message: 'Posts fetched successfully', success: true, data: updatedPosts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Internal Server Error ${error.message}`, success: false });
    }
}
 
const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const deletedPost = await NewPost.findByIdAndDelete(postId);

    if (!deletedPost) {
      return res.status(404).json({ message: 'Post not found', success: false });
    }

    const getPublicIdFromUrl = (url) => {
      const parts = url.split('/upload/');
      if (parts.length < 2) return null;
      return parts[1].split('.')[0]; // returns public ID
    };

    if (deletedPost?.imageUrl?.length > 0) {
      const deleteResults = await Promise.all(
        deletedPost.imageUrl.map(async (item) => {
          const publicId = getPublicIdFromUrl(item);
          console.log('Deleting publicId:', publicId);
          if (publicId) {
            const response = await cloudinary.uploader.destroy(publicId);
            console.log('Cloudinary delete response:', response);
            return response;
          }
        })
      );
    }

    await Favourite.updateMany(
      { likedProducts: postId },
      { $pull: { likedProducts: postId } }
    );

    res.status(200).json({ message: 'Post deleted successfully', success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Internal Server Error ${error.message}`, success: false });
  }
};

 
 

const likedBy = async (req, res) => {
  try {
    const { id,userId } = req.params; 
   
    if (!userId) {
      return res.status(400).json({ message: "User ID is required",success:false });
    }


    const user = await User.findById(userId)

    if(!user){
      return res.status(404).json({
        message:'user not found',
        success:false
      })
    }
 
    const post = await NewPost.findById(id);
    if (!post) {
      return res.status(404).json({ message: "post not found" ,success:false});
    }

    const shop = await ShopDetails.findById(post.shopId)
 
    const isLiked = post.likes.some((like) => like.toString() === userId);
 
    const update = isLiked
      ? { $pull: { likes: userId } }
      : { $addToSet: { likes: userId } }; 
 
    const updatedPost = await NewPost.findByIdAndUpdate(id, update, { new: true });

    const isUserEngaged = shop.engagement.some((e)=> e.userId.toString() === userId)

    if(!isUserEngaged){
      shop.engagement.push({
        userId:userId,
        engagementType:"like"
      })

      await shop.save()
    }
 
    if(!updatedPost){
      return res.status(400).json({
        message:'failed to like or unlike post',
        success:false
      })
    }

    if(isLiked){
      const favoriteCart = await Favourite.findOne({userId})
      favoriteCart.likedProducts = favoriteCart.likedProducts.filter(product => !product.equals(id));
      await favoriteCart.save()
      console.log('favoriteCart',favoriteCart)
    }
    else{
      let favoriteCart = await Favourite.findOne({userId})
      if(!favoriteCart){
       
       favoriteCart = new Favourite({
        userId,
        likedProducts:[id]
       })
       await favoriteCart.save()
       console.log('favoriteCart',favoriteCart)
      }
      else{
        if(!favoriteCart.likedProducts.includes(id)){
          favoriteCart.likedProducts.push(id)
          await favoriteCart.save()
          console.log('favoriteCart',favoriteCart)
        }
      }
      
    }
    res.status(200).json({
      message: isLiked ? "Post unliked" : "Post liked",
      likes: updatedPost.likes.length,
    });
  } catch (error) {
    console.error("Error liking post:", error);
    res.status(500).json({ message: "Error liking post", error: error.message ,success:false});
  }
};
module.exports = { createPost, updatePost, getAllPosts, getPostById, getPostsByShopId, deletePost,likedBy };