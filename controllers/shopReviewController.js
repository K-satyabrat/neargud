const mongoose = require("mongoose");
const moment = require("moment");
const ShopReview = require("../models/shopReviewModel");
const SubscriptionPlan = require("../models/subscriptionModel");
const calculateAverageRating = require("../utils/calculateRating");
const ShopDetails = require("../models/shopModel");
const User = require("../models/userModel");

// Function to calculate average rating
 


// Create or Update a Shop Review
const createOrUpdateReview = async (req, res) => {
  try {
    const { userId, shopId, rating, review } = req.body;


    if(!userId || !shopId || !rating || !review){
        return res.status(400).json({
            message:"all fields are required",
            success:false
        })
    }

    
   if (!mongoose.Types.ObjectId.isValid(shopId) || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid Id format for shopId Or Invalid Id format for userId ",
    });
  }

    const shop = await ShopDetails.findById(shopId)
    if(!shop){
      return res.status(400).json({
        message:"shop not found",
        success:false,
      })
    }

    const user = await User.findById(userId)
    if(!user){
      return res.status(400).json({
        message:"user not found",
        success:false,
      })
    }
    // Check if the shop has an active subscription plan
    const subscription = await SubscriptionPlan.findOne({ shopId });
    if (!subscription) {
      return res.status(403).json({
        message: "Reviews are only allowed for shops with an active subscription plan.",
        success:false
      });
    }

    // Check if the user already reviewed the shop
    let existingReview = await ShopReview.findOne({ userId, shopId });

    if (existingReview) {
      // Update existing review
      existingReview.rating = rating || existingReview.rating;
      existingReview.review = review || existingReview.review;
      existingReview.updatedAt = new Date(); // Update timestamp

      await existingReview.save();
    } else {
      // Create a new review
      existingReview = new ShopReview({ userId, shopId, rating, review });
      await existingReview.save();
    }

    // Calculate updated average rating
    const averageRating = await calculateAverageRating(shopId);

    res.status(200).json({
      message: existingReview ? "Review updated successfully!" : "Review added successfully!",
      review: existingReview,
      averageRating,
    });
  } catch (error) {
    console.error("Error creating/updating review:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get all shop reviews with average rating & formatted time ago
const getShopAllReviews = async (req, res) => {
  try {
   const {shopId} = req.params
   const {page=1,limit=10}=req.query
   const currentPage = parseInt(page);

   if(!shopId){
    return res.status(400).json({
      message:'shopId is required',
      success:false
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
      success:false
    })
   }
    const reviews = await ShopReview.find({shopId})
      .populate("userId", "name accountType image")
      .populate("shopId", "name")
      .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));
    const totalPage = Math.ceil(reviews.length / parseInt(limit));
    
    if (reviews.length === 0) {
      return res.status(404).json({ message: "No reviews found.", success:false });
    }

    // Compute the average rating for each shop
    const shopRatings = {};
    for (const review of reviews) {
      if (!shopRatings[review.shopId]) {
        const rating = await calculateAverageRating(review.shopId._id);
        shopRatings[review.shopId] = rating.averageRating
      }
    }
 
    const formattedReviews = reviews.map((review) => ({
      _id: review._id,
      user: {
        name: review.userId.name,
        profileImage: review.userId.image,
        accountType:review.userId.accountType
      },
      rating: review.rating,
      review: review.review,
      shop: review.shopId.name,
      averageRating: shopRatings[review.shopId], // Use dynamically calculated average rating
      timeAgo: moment(review.updatedAt).fromNow(), // Use Moment.js for "time ago"
    }));

    res.status(200).json({ reviews: formattedReviews,currentPage,
      totalRecords:formattedReviews.length,
      totalPage,
      hasNextPage: currentPage < totalPage,
      hasPrevPage: currentPage > 1,
      page: parseInt(page), });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ message: "Internal Server Error", success:false });
  }
};


//  Delete Shop Review by userId
const deleteReviewByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Id format for userId",
      });
    }

    //  Find and delete the review
    const deletedReview = await ShopReview.findOneAndDelete({ userId });

    if (!deletedReview) {
      return res.status(404).json({ message: "No review found for this user." });
    }

    //  Recalculate average rating
    const averageRating = calculateAverageRating(deletedReview.shopId);

    res.status(200).json({
      message: "Review deleted successfully.",
      averageRating,
      deletedReview,
    });
  } catch (error) {
    console.error(" Error deleting review:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { createOrUpdateReview, getShopAllReviews, deleteReviewByUserId };
