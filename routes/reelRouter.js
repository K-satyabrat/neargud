const express = require("express");
 
const multer = require("multer");
const { storage } = require("../utils/cloudinary");
// const authMiddleware = require("../middleware/auth.middleware.js");
const { likedBy, getReels, getReelsByUserId, reelViews, shareReel, createReel, getReelById, deleteReel, createComment, replyToComment, getReelComments, deleteComment, deleteReply } = require("../controllers/reelController.js");
const upload = multer({ storage });
 
 
 
const reelsRoute = express.Router();
 
reelsRoute.post(
  "/create-reels",
  upload.fields([{ name: "video" }]),
  createReel
);
reelsRoute.get("/all-reels/:userId", getReels);
reelsRoute.get("/reels-user/:user", getReelsByUserId);
reelsRoute.put("/like-reels/:id/:userId", likedBy);
reelsRoute.put("/view-reels/:id/:userId", reelViews);
reelsRoute.put("/share/:reelId/:senderId", shareReel);
reelsRoute.get("/getReelById/:reelId/:userId", getReelById);
reelsRoute.delete('/deleteReelById/:reelId',deleteReel)
reelsRoute.post("/create-comment", createComment );
reelsRoute.post("/reply-to-comment", replyToComment );
reelsRoute.post("/reels/:reelId/comments", getReelComments );
reelsRoute.put("/detete-comment/:reelId/:commentId/:userId", deleteComment );
reelsRoute.put('/delete-reply/:reelId/:commentId/:replyId/:userId', deleteReply);
 
 
module.exports = reelsRoute;