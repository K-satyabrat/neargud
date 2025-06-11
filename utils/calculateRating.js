const { default: mongoose } = require("mongoose");
const ShopReview = require("../models/shopReviewModel");

const calculateShopReviewStats = async (shopId) => {
    try {
        if (!mongoose.isValidObjectId(shopId)) {
            return { averageRating: 5.0, reviewCount: 0 };
        }

        const objectId = new mongoose.Types.ObjectId(shopId);
        const result = await ShopReview.aggregate([
            { $match: { shopId: objectId } },
            { 
                $group: { 
                    _id: "$shopId", 
                    averageRating: { $avg: "$rating" },
                    reviewCount: { $sum: 1 } // Count total reviews
                } 
            }
        ]);

        return result.length > 0 
            ? { 
                averageRating: parseFloat(result[0].averageRating), 
                reviewCount: result[0].reviewCount 
              } 
            : { averageRating: 5.0, reviewCount: 0 };

    } catch (error) {
        console.error("Error calculating shop review stats:", error);
        return { averageRating: "Error", reviewCount: "Error" };
    }
};

module.exports = calculateShopReviewStats;
