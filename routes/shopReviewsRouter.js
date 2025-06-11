const express = require("express");
const { createOrUpdateReview, getShopAllReviews, deleteReviewByUserId } = require("../controllers/shopReviewController");
const shopReviewsRouter = express.Router();
 
shopReviewsRouter.post("/createOrUpdateShopReviews", createOrUpdateReview);
shopReviewsRouter.get("/getShopAllreviews/:shopId", getShopAllReviews);
shopReviewsRouter.delete("/deleteShopReview/:userId", deleteReviewByUserId);


module.exports = shopReviewsRouter;
