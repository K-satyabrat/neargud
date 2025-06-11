
const { default: mongoose } = require("mongoose");
const Favourite = require("../models/faouriteCartModel");
const Follower = require("../models/follewerModel");
const NewPost = require("../models/postModel");
const ShopDetails = require("../models/shopModel");
const SubscriptionPlan = require("../models/subscriptionModel");
const User = require("../models/userModel");
const calculateAverageRating = require("../utils/calculateRating");
const getCoordinatesFromAddress = require("../utils/getLocationCoordinate");
const ShopReview = require("../models/shopReviewModel");
const Chat = require("../models/chatModel");
const getCityByCoordinates = require("../utils/getCityByCoordinate");
const cloudinary = require("cloudinary").v2;
 
 
 
const createShop = async (req, res) => {
  try {
    const {
      shopkeeperId,
      shopName,
      address,
      regularOffer,
      category,
      subCategory,
      contactNumber,
      bio,
    } = req.body;
 
    if (
      !shopkeeperId ||
      !shopName ||
       !address||
      !category ||
      !contactNumber
    ) {
      return res
        .status(400)
        .json({
          message: "All required fields must be filled",
          success: false,
        });
    }

    if (!mongoose.Types.ObjectId.isValid(shopkeeperId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Id format for shopkeeperId",
      });
    }
 
    const user = await User.findById(shopkeeperId);
    if (!user) {
      return res
        .status(404)
        .json({ message: "User or Profile not found", success: false });
    }

    const isShopAwailable = await ShopDetails.findOne({shopkeeperId})

   if(isShopAwailable){
  return res.status(400).json({
    message:'you already have shop',
    success:false,
  })
   }
    const phoneRegex = /^[0-9]{10}$/;
    if (!contactNumber || !phoneRegex.test(contactNumber)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits.",
      });
    }

    const checkContactNumber = await ShopDetails.findOne({contactNumber})

    if(checkContactNumber){
      return res.status(400).json({
        message: 'contact number exist',
        success:false,
      })
    }
 const locationData = await getCoordinatesFromAddress(address)

 if(!locationData){
  return res.status(400).json({
    message:'invalid address',
    success:false
  })
 }
 let updateCaategory = category.toLowerCase()
 
 if(subCategory){
  if(subCategory.category){
   subCategory.category = subCategory.category.toLowerCase()
   if(subCategory.subCategory){
    subCategory.subCategory = subCategory.subCategory.toLowerCase()
   }
  }

 }
 let bannerImage = null
    if(req.files){
      bannerImage = req.files.image[0].path
    }
    const shop = new ShopDetails({
      shopkeeperId,
      bannerImage,
      shopName,
      shopLocation:{
        type: "Point",
        coordinates: [parseFloat(locationData.longitude), parseFloat(locationData.latitude)],
      },
      address:address,
      regularOffer,
      category:updateCaategory,
      subCategory,
      contactNumber,
      bio,
    });
 
    await shop.save();
    user.accountType='business'
    
   const isFollower = await Follower.findOne({userId:shopkeeperId})

   if(!isFollower){
    await Follower.create({
      userId:shopkeeperId
    })
   }

    await user.save()
    userSubscription = await SubscriptionPlan.findOne({userId:shopkeeperId});
    if(userSubscription){
      userSubscription.shopId.push(shop._id)
      await userSubscription.save()
    }
    res
      .status(201)
      .json({
        message: "Shop created successfully",
        success: true,
        data: shop,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Internal Server Error ${error.message}`, success: false });
  }
};
 
const getShopDetails = async (req, res) => {
  try {
    const {shopId,userId} = req.params 
   
    if (!shopId || !userId) {
      return res
        .status(404)
        .json({ message: "ShopId or userId not found", success: false });
    }
   
    if (!mongoose.Types.ObjectId.isValid(shopId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Id format for shopId Or Invalid Id format for userId ",
      });
    }
  
 
    const shop = await ShopDetails.findById(shopId)

 
    if (!shop) {
      return res
        .status(404)
        .json({ message: "Shop not found", success: false });
      }

      const user = await User.findById(userId)

      if(!user){
        return res.status(400).json({
          message:'user not found',
          success:false
        })
      }

    const rating = await calculateAverageRating(shopId)
    const shopOwner = await User.findById(shop.shopkeeperId).select("name image")
    const shopPostsCount = await NewPost.find({shopId}).countDocuments()
    const follower = await Follower.findOne({ userId: shop.shopkeeperId }).populate({
      path: 'followers',
      populate: {
        path: 'followerId',
        select: 'name'
      }
    });

  
    const followersCount= follower?follower.length:0;
    const posts = await NewPost.find({ shopId }).select('imageUrl') // Replace 'imageUrl' with the correct field name if different
    const isFollowed = follower?.followers?.some((f) => f.followerId._id.toString() === userId.toString());
      const isLiked = shop.likes?.some((id) => id.toString() === userId.toString());
      const shareableLink = `${process.env.BASE_URL || 'https://neargud-be.onrender.com'}/api/user/shop/getShopDetails/${shop._id}`
     const isSubscription = await SubscriptionPlan.findOne( {userId:shop.shopkeeperId,$expr: { $gt: [ "$endDate", new Date() ] } })
     const isChatWithShopkeeper = await Chat.findOne({participants:{$all: [userId, shop.shopkeeperId]}  })
    let data = {...shop.toObject()}

    console.log(isChatWithShopkeeper)

    data.shopAverageRating=rating.averageRating
    data.shopReviewCount=rating.reviewCount
    data.shopOwner=shopOwner
    data.shopPostsCount=shopPostsCount
    data.followersCount=followersCount
    data.isLiked=isLiked
    data.shareableLink=shareableLink
    data.posts=posts
    data.followers=follower
    data.isFollowed=isFollowed
    data.isSubscription=isSubscription?true:false
    data.isChatWithShopkeeper=isChatWithShopkeeper?true:false
    data.chatId=isChatWithShopkeeper?isChatWithShopkeeper._id.toString():null



    const checkVisitor = shop.visitors.some((user)=> user._id.toString() === userId.toString())
    if(!checkVisitor){
      shop.visitors.push(userId)
      await shop.save()
    }
    res
      .status(200)
      .json({
        message: "Shop details fetched successfully",
        success: true,
        data: data,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Internal Server Error ${error.message}`, success: false });
  }
};
 
const updateShop = async (req, res) => {
  try {
    const {shopId} = req.params
    const { shopName, address, category, subCategory,bio, contactNumber,regularOffer,description } = req.body;
     console.log('bannerImage',req.files)
     if(!shopId ){
      return res.status(400).json({
        message:'shopId required'
      })
     }
     if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Id format for shopId",
      });
    }
     const shop = await ShopDetails.findById(shopId)
     if(!shop){
      return res.status(400).json({
        message:'shop not found',
        success:false,
      })
     }
     let location = null
     if(address){
      const locationData = await getCoordinatesFromAddress(address)

      if(!locationData){
       return res.status(400).json({
         message:'invalid address',
         success:false
       })
      }
     location =  {
      type: "Point",
      coordinates: [parseFloat(locationData.longitude), parseFloat(locationData.latitude)]
  };
     }

     let bannerImage = null
     if(req.files && req.files.image){
       bannerImage = req.files.image[0].path
      
     }
    
     if (shopName) shop.shopName = shopName;
     if (category) {
      shop.category = category.toLowerCase();
    }
     if (subCategory){
      if(subCategory.category){
        shop.category = subCategory.category.toLowerCase();
        if(subCategory.subCategory){
          shop.subCategory.subCategory = subCategory.subCategory.toLowerCase();
        }
      }
      shop.subCategory = subCategory;
     }
     if (regularOffer) shop.regularOffer = regularOffer;
     if (address) {
      shop.shopLocation =  location
      shop.address=address
  }
  if(description) shop.description = description;
  if(bannerImage){
    //delete old image from cloudinary
    if(shop.bannerImage){
      const publicId = shop.bannerImage.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/");  // Extract the public ID from the URL
      await cloudinary.uploader.destroy(publicId);
    }
     shop.bannerImage=bannerImage;
  }
   
    if ( contactNumber) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!contactNumber || !phoneRegex.test(contactNumber)) {
        return res.status(400).json({
          success: false,
          message: "Phone number must be exactly 10 digits.",
        });
      }
      const checkContactNumber = await ShopDetails.findOne({contactNumber:contactNumber})
      if(checkContactNumber){
        return res.status(400).json({
          message: 'contact number exist',
          success:false,
        })
      }
      shop.contactNumber = contactNumber;
  }
  
  if(bio) shop.bio = bio;
    const updatedshop = await shop.save();
 
    if (!updatedshop) {
      return res
        .status(400)
        .json({ message: "faild to update shop", success: false });
    }
    
 
    res
      .status(200)
      .json({
        message: "Shop details updated successfully",
        success: true,
        data: updatedshop,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Internal Server Error ${error.message}`, success: false });
  }
};
 
const deleteShop = async (req, res) => {
  try {
    const shopId =req.params.shopId;
    if (!shopId) {
      return res
        .status(404)
        .json({ message: "ShopId not found", success: false });
    }

    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Id format for shopId",
      });
    }
    await ShopReview.deleteMany({shopId:shopId})
    await NewPost.deleteMany({shopId:shopId})
    const shop = await ShopDetails.findOneAndDelete({_id:shopId });
  
    if(shop){
      if(shop.bannerImage){
      const publicId = shop.bannerImage.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/");  // Extract the public ID from the URL
      const result = await cloudinary.uploader.destroy(publicId);
      }
      await Favourite.updateMany(
        { likedShops: shopId },
        { $pull: { likedShops: shopId } }
      )
    }

    if (!shop) {
      return res
        .status(404)
        .json({ message: "Shop not found", success: false });
    }
  userShubscription = await SubscriptionPlan.findOne({userId:shop.shopkeeperId});
  if(userShubscription){
    userShubscription.shopId = userShubscription.shopId.filter((id)=>id!=shopId)
    await userShubscription.save()
  }
    res
      .status(200)
      .json({ message: "Shop deleted successfully", success: true ,data:shop});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: `Internal Server Error ${error.message}`, success: false });
  }
};

const getAllShops = async (req, res) => {
  try {
    const {userId}=req.params
    const { category,suggested, latitude, longitude, topListed, searchTitle , limit = 10, page = 1 } = req.query;
    const currentPage = parseInt(page);

    const query = [];
    if(!userId){
      return res.status(400).json({
        message:'userId is required',
        success:false
      })
    }

    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Id format for userId",
      });
    }
    const user = await User.findById(userId)

    if(!user){
      return res.status(404).json({
        message:'user not found',
        success:false
      })
    }
     
    if (latitude && longitude) {
      query.push({
        $geoNear: {
          near: { type: "Point", coordinates: [parseFloat(longitude), parseFloat(latitude)] }, // [longitude, latitude]
          distanceField: "distance",
          maxDistance: 10000,   
          spherical: true,
        },
      });
    } else {
      query.push({ $match: {} }); 
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
    
    if (searchTitle &&  searchTitle!=="false" && searchTitle !== "undefined" && searchTitle !== "null") {
      
 // if searchTitle is emplty then also  fetch all shops
    if(searchTitle === "") {
      query.push({
        $match: {}    
      });
      } else {
      
      function escapeRegex(text) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      }
       
      const searchTitleEscaped = escapeRegex(searchTitle.toLowerCase())
      query.push({ 
        $lookup: {
          from: "newposts",
          localField: "_id",
          foreignField: "shopId",
          as: "shopPosts"
        }
      },)
   
      query.push({
        $match: {
          $or: [
            { shopName: { $regex: searchTitleEscaped, $options: "i" } },
            {category: { $regex: searchTitleEscaped, $options: "i" } },
            { "subCategory.subCategory": { $regex: searchTitleEscaped, $options: "i" } },
            { "subCategory.category": { $regex: searchTitleEscaped, $options: "i" } },
          
          { 
              "shopPosts.caption": { $regex: searchTitleEscaped, $options: "i" }
          },
          {
            "shopPosts.description": { $regex: searchTitleEscaped, $options: "i" }
          },
          {
            "shopPosts.category": { $regex: searchTitleEscaped, $options: "i" }
          },
         
          ]
        }
      });
    }
      
    }

    
    query.push(
      {
        $lookup: {
          from: "subscriptionplans",
          localField: "_id",
          foreignField: "shopId",
          as: "subscription",
        },
      },
      {
        $addFields: {
          subscriptionPlan: { $arrayElemAt: ["$subscription.subscriptionPlan", 0] },
          features: { $ifNull: [{ $arrayElemAt: ["$subscription.features", 0] }, []] },
          endDate: { $ifNull: [{ $arrayElemAt: ["$subscription.endDate", 0] }, new Date(0)] },
        },
      }
    );

    
    query.push(
      {
        $addFields: {
          isTopListed: {
            $cond: {
              if: {
                $and: [
                  { 
                    $or: [
                      { $in: ["top10List", "$features"] },
                      { $in: ["guaranteedTopVisibility", "$features"] }
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
          isSuggested: {
            $cond: {
              if: {
                   $in: ["Suggested Business", "$features"]              
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

    
    query.push(
      {
        $lookup: {
          from: "newposts",
          localField: "_id",
          foreignField: "shopId",
          as: "posts",
        },
      },
      {
        $addFields: {
          postData: { 
        $map: { 
          input: "$posts", 
          as: "post", 
          in: { imageUrl: "$$post.imageUrl", caption: "$$post.caption" } 
        } 
          },
        },
      }
        );

    query.push(
      {
        $lookup: {
          from: "reels",
          localField: "_id",
          foreignField: "shopId",
          as: "reels",
        },
      },
      {
        $addFields: {
          shopVideos: { 
            $map: { input: "$reels", as: "reel", in: "$$reel.videoUrl" } 
          },
        },
      }
    );

    
    if (topListed === "true") {
      query.push({
        $match: { isTopListed: true },
      });
    }

    if (suggested === "true") {
      query.push({
        $match: { isSuggested: true },
      });
    }

     
    const sortStage = {
      $sort: {
        isTopListed: -1,  
      },
    };

    

    if (latitude && longitude) {
      sortStage.$sort.distance = 1;
    }

    if (searchTitle) {
      sortStage.$sort.isGuaranteedTopVisibility= -1;
      sortStage.$sort.is3xvisibility = -1;
      sortStage.$sort.is1xvisibility = -1;
    }

    if(suggested){
      sortStage.$sort.isSuggested= -1
    }
    query.push(sortStage);

    const ratingQuery = [
      {
        $group: {
          _id: "$shopId",
          averageRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ];

    

    const ratingResults = await ShopReview.aggregate(ratingQuery);


    const shopRatings = ratingResults.reduce((acc, rating) => {
      acc[rating._id.toString()] = {
        averageRating: rating.averageRating,
        reviewCount: rating.reviewCount,
      };
      return acc;
    }, {});

    query.push({
      $addFields: {
        averageRating: {
          $ifNull: [shopRatings["$_id"], { averageRating: 0, reviewCount: 0 }],
        },
      },
        });

        query.push({
      $project: {
        shopName: 1,
        shopLocation: 1,
        category: 1,
        subCategory: 1,
        contactNumber: 1,
        postData: 1,
        shopVideos: 1,
        distance: 1,
        likes: 1,
        bannerImage: 1,
        averageRating: 1,
        shopkeeperId: 1,
        address: 1,
      },
        });

        query.push({
      $match: {
        shopkeeperId: { $ne:new mongoose.Types.ObjectId(userId) },
      },
        });


        const isFollowedQuery = [
          {
            $lookup: {
              from: "followers",
              localField: "shopkeeperId",
              foreignField: "userId",
              as: "followersData",
            },
          },
          {
            $addFields: {
              isFollowed: {
                $cond: {
                  if: {
                    $in: [
                      new mongoose.Types.ObjectId(userId),
                      { $ifNull: [{ $arrayElemAt: ["$followersData.followers.followerId", 0] }, []] }
                    ],
                  },
                  then: true,
                  else: false,
                },
              },
            },
          },
        ];
    
        query.push(...isFollowedQuery);
       
  

        const totalRecords = (await ShopDetails.aggregate(query)).length;
        const shops = await ShopDetails.aggregate(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
        const totalPage = Math.ceil(totalRecords / parseInt(limit));

        let updatedShops = shops.map((shop) => {
      const isLiked = shop.likes?.some((id) => id.toString() === userId.toString());
      const shareableLink = `${process.env.BASE_URL || 'https://neargud-be.onrender.com'}/api/user/shop/getShopDetails/${shop._id}`
      return { ...shop, isLiked,shareableLink };
    });
    
    
    return res.status(200).json({
      success: true,
      data:updatedShops,
      currentPage,
      totalRecords ,
      totalPage,
      hasNextPage: currentPage < totalPage,
      hasPrevPage: currentPage > 1,
      page: parseInt(page),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error",error:error.message,success:false });
  }
};

const likedBy = async (req, res) => {
  try {
    const { id,userId } = req.params; 
   
    if (!userId) {
      return res.status(400).json({ message: "User ID is required",success:false });
    }
 
        
   if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Id format for id Or Invalid Id format for userId ",
    });
  }
    const shop = await ShopDetails.findById(id);
    if (!shop) {
      return res.status(404).json({ message: "shop not found" ,success:false});
    }
 

    const user = await User.findById(userId)

    if(!user){
      return res.status(404).json({
        message:'user not found',
        success:false
      })
    }
 
    const isLiked = shop.likes.some((like) => like.toString() === userId);
 
    const update = isLiked
      ? { $pull: { likes: userId } }
      : { $addToSet: { likes: userId } }; 

    const isUserEngaged = shop.engagement.some((e)=> e.userId.toString() === userId)

    if(!isUserEngaged){
      shop.engagement.push({
        userId:userId,
        engagementType:"like"
      })

      await shop.save()
    }
 
    const updatedshops = await ShopDetails.findByIdAndUpdate(id, update, { new: true });
 
    if(!updatedshops){
      return res.status(400).json({
        message:'failed to like or unlike shop',
        success:false
      })
    }

    if(isLiked){
      const favoriteCart = await Favourite.findOne({userId})
      favoriteCart.likedShops = favoriteCart.likedShops.filter(shop => !shop.equals(id));
      await favoriteCart.save()
      console.log('favoriteCart',favoriteCart)
    }
    else{
      let favoriteCart = await Favourite.findOne({userId})
      if(!favoriteCart){
       
       favoriteCart = new Favourite({
        userId,
        likedShops:[id],
        
       })
       await favoriteCart.save()
       
      }
      else{
        if(!favoriteCart.likedShops.includes(id)){
          favoriteCart.likedShops.push(id)
          await favoriteCart.save()
          
        }
      }
      
    }
    res.status(200).json({
      message: isLiked ? "shop unliked" : "shop liked",
      likes: updatedshops.likes.length,
    });
  } catch (error) {
    console.error("Error liking shop:", error);
    res.status(500).json({ message: "Error liking shop", error: error.message });
  }
};

const getMonthlyVisitorStats = async (req, res) => {
  try {
      const { shopId } = req.params;
      if (!mongoose.Types.ObjectId.isValid(shopId)) {
          return res.status(400).json({ message: "Invalid shop ID" ,success:false});
      }

      const now = new Date();
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      const shop = await ShopDetails.findById(shopId);
      if (!shop) {
          return res.status(404).json({ message: "Shop not found" });
      }

      // Count visitors in the current month
      const currentMonthVisitors = shop.visitors.filter(visitor => {
          return new Date(visitor.addedAt) >= startOfCurrentMonth;
      }).length;

      // Count visitors in the previous month
      const previousMonthVisitors = shop.visitors.filter(visitor => {
          return new Date(visitor.addedAt) >= startOfPreviousMonth && new Date(visitor.addedAt) <= endOfPreviousMonth;
      }).length;

      // Calculate percentage change
      let percentageChange = 0;
      if (previousMonthVisitors > 0) {
          percentageChange = ((currentMonthVisitors - previousMonthVisitors) / previousMonthVisitors) * 100;
      } else if (currentMonthVisitors > 0) {
          percentageChange = 100; // If previous month had 0 visitors, assume 100% increase
      }

      res.status(200).json({
           message:'visitors stats fetch successfully',
           data:{currentMonthVisitors,previousMonthVisitors,percentageChange}
      });
  } catch (error) {
      console.error("Error getting visitor stats:", error);
      res.status(500).json({ message: "Internal server error" });
  }
};

const getUniqueShopAddresses = async (req, res) => {
  try {
      // Fetch unique addresses along with latitude and longitude
      const addresses = await ShopDetails.aggregate([
          {
              $match: { address: { $ne: null }, "shopLocation.coordinates": { $ne: null } }
          },
          {
              $group: {
                  _id: "$address",
                  latitude: { $first: { $arrayElemAt: ["$shopLocation.coordinates", 1] } },
                  longitude: { $first: { $arrayElemAt: ["$shopLocation.coordinates", 0] } }
              }
          },
          {
              $project: {
                  _id: 0,
                  address: "$_id",
                  latitude: 1,
                  longitude: 1
              }
          }
      ]);

      const uniqueAddresses =await Promise.all(addresses.map( async (address) => {
        return {
               city: await getCityByCoordinates(address.latitude, address.longitude),
                latitude: address.latitude,
                longitude: address.longitude
        };

      } )  
      );
    
      // remove duplicates
      const updatedCities = uniqueAddresses.filter((address, index, self) =>
          index === self.findIndex((a) => (
              a.city === address.city
          ))
      );

      
        console.log('cities',updatedCities)
      res.status(200).json({ success: true, addresses,cities:updatedCities, message: "Unique addresses fetched successfully" });
  } catch (error) {
      res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};


const getShopsByUserId = async (req, res) => {
  try {
      const { userId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({ message: "Invalid User ID",success:false });
      }

      const userExists = await User.findById(userId);
      if (!userExists) {
          return res.status(404).json({ message: "User not found",success:false });
      }

      const shop = await ShopDetails.findOne({shopkeeperId:userId});

      if (!shop) {
          return res.status(404).json({ message: "No shops found for this user",success:false });
      }

      res.status(200).json({ success: true, data:shop,message: "Shop details fetched successfull"});
  } catch (error) {
      res.status(500).json({ success: false, message: error.message });
  }
};

//get monlthly shop engagement stats
const getMonthlyShopEngagementStats = async (req, res) => {
  try {
    const { shopId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(shopId)) {
        return res.status(400).json({ message: "Invalid shop ID" ,success:false});
    }

    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const shop = await ShopDetails.findById(shopId);
    if (!shop) {
        return res.status(404).json({ message: "Shop not found" });
    }

    // Count visitors in the current month
    const currentMonthEngagements = shop.engagement.filter(person => {
        return new Date(person.engagementAt) >= startOfCurrentMonth;
    }).length;

    // Count visitors in the previous month
    const previousMonthEngagements= shop.engagement.filter(person => {
        return new Date(person.engagementAt) >= startOfPreviousMonth && new Date(person.engagementAt) <= endOfPreviousMonth;
    }).length;

    // Calculate percentage change
    let percentageChange = 0;
    if (previousMonthEngagements > 0) {
        percentageChange = ((currentMonthEngagements - previousMonthEngagements) / previousMonthEngagements) * 100;
    } else if (currentMonthEngagements > 0) {
        percentageChange = 100; // If previous month had 0 visitors, assume 100% increase
    }

    res.status(200).json({
         message:'shop engagements stats fetch successfully',
         data:{currentMonthEngagements,previousMonthEngagements,percentageChange}
    });
} catch (error) {
    
    res.status(500).json({ message: "Internal server error",error: error.message });
}
}

module.exports ={createShop,updateShop,deleteShop,getShopDetails,getAllShops,likedBy,
  getMonthlyVisitorStats,getUniqueShopAddresses,getShopsByUserId,getMonthlyShopEngagementStats}