 
const Favourite = require("../models/faouriteCartModel");
const Follower = require("../models/follewerModel");
const Reels = require("../models/reelModel");
const ShopDetails = require("../models/shopModel");
const SubscriptionPlan = require("../models/subscriptionModel");
const User = require("../models/userModel");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;
 
const createReel = async (req, res) => {
  try {
    
    const { caption ,userId} = req.body;
 
    // Validate userId
    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
        success: false,
      });
    }

      if (!mongoose.Types.ObjectId.isValid(userId)) {
              return res.status(400).json({
                success: false,
                message: "Invalid  userId format.",
              });
            }
    
 
    // Find the user's subscription plan
    const subscribedUser = await SubscriptionPlan.findOne({ userId });
 
    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }
 
    // Check if the user has an active subscription
    if (!subscribedUser || !subscribedUser.subscriptionPlan) {
      return res.status(401).json({
        message: "You need a subscription to upload reels",
        success: false,
      });
    }
 
    // Check if the subscription is expired
    const currentDate = new Date();
    if (subscribedUser.endDate < currentDate) {
      return res.status(401).json({
        message: "Your subscription has expired. Please renew to upload reels.",
        success: false,
      });
    }
 const shop = await ShopDetails.findOne({shopkeeperId:userId})
    // Check if a video file is uploaded
  
    if (!req.files || !req.files.video) {
      return res.status(400).json({
        message: "No video file uploaded",
        success: false,
      });
    }
 
    const videoFile = req.files.video;
 
    // If using multer, the file path is usually in `path`
    const videoUrl = Array.isArray(videoFile)
      ? videoFile[0]?.path
      : videoFile.path;
 
    // Save reel in MongoDB
    const newReel = new Reels({
      user: userId,
      shopId:shop._id,
      videoUrl,
      caption,
    });
 
    await newReel.save();
 
    return res.status(201).json({
      message: "Reel created successfully",
      success: true,
      data: newReel,
    });
  } catch (err) {
    console.error("Error creating reel:", err.message);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};
 
const getReels = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    
    const {userId} = req.params
    const limit =parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
 
    if (!userId) {
      return res.status(400).json({ message: "User ID is required",success:false });
    }
 
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid  userId format.",
      });
    }

    const user = await User.findById(userId)

    if(!user){
      return res.status(404).json({
        success: false,
        message: "user not found",
      });
    }
    const reels = await Reels.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("user", "name image")
      .populate({
        path: "comments.user",
        select: "name image"
      })
      .populate({
        path: "comments.replies.user",
        select: "name image"
      })
      .lean(); // Use lean() for better performance when adding custom fields

    reels.forEach(reel => {
      reel.comments.forEach(comment => {
        const commentTimeDifference = Date.now() - new Date(comment.createdAt).getTime();
        const commentTimeAgo = Math.floor(commentTimeDifference / (1000 * 60 * 60 * 24)) > 0
          ? `${Math.floor(commentTimeDifference / (1000 * 60 * 60 * 24))} days ago`
          : Math.floor(commentTimeDifference / (1000 * 60 * 60)) > 0
          ? `${Math.floor(commentTimeDifference / (1000 * 60 * 60))} hours ago`
          : `${Math.floor(commentTimeDifference / (1000 * 60))} minutes ago`;

        comment.timeAgo = commentTimeAgo;

        comment.replies.forEach(reply => {
          const replyTimeDifference = Date.now() - new Date(reply.createdAt).getTime();
          const replyTimeAgo = Math.floor(replyTimeDifference / (1000 * 60 * 60 * 24)) > 0
            ? `${Math.floor(replyTimeDifference / (1000 * 60 * 60 * 24))} days ago`
            : Math.floor(replyTimeDifference / (1000 * 60 * 60)) > 0
            ? `${Math.floor(replyTimeDifference / (1000 * 60 * 60))} hours ago`
            : `${Math.floor(replyTimeDifference / (1000 * 60))} minutes ago`;

          reply.timeAgo = replyTimeAgo;
        });
      });
    });   
    if (reels.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No reels found",
        data: [],
        currentPage: page,
        totalReels: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      });
    }

    const updateReels =await Promise.all( reels.map(async(reel)=>{
      const follower = await Follower.findOne({userId:reel.user})
      const isFollowed = follower?.followers?.some((follower)=> follower.followerId.toString()===userId.toString())
      const isLiked = reel.likes?.some((id) => id.toString() === userId.toString());
      const shareableLink = `${process.env.BASE_URL || 'https://neargud-be.onrender.com'}/api/user/reel/getReelById/${reel._id}`
      return {...reel,shareableLink,isLiked,isFollowed}
    }))
 
    const totalReels = await Reels.countDocuments();
    return res.status(200).json({
      success: true,
      message: "Reels fetched successfully",
      data: updateReels,
      currentPage: page,
      totalReels,
      totalPages: Math.ceil(totalReels / limit),
      hasNextPage: page < Math.ceil(totalReels / limit),
      hasPrevPage: page > 1,
    });
  } catch (error) {
    console.error("Error fetching reels:", error);
 
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
 
const getReelsByUserId = async (req, res) => {
  try {
    const { user } = req.params;
 
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(user)) {
      return res.status(400).json({
        success: false,
        message: "Invalid  userId format.",
      });
    }
 
    const reels = await Reels.find({ user });
 
    if (!reels.length) {
      return res.status(404).json({
        success: false,
        message: "No reels found for this user",
      });
    }
 
    return res.status(200).json({
      success: true,
      message: "Reels fetched successfully",
      data: reels,
    });
  } catch (error) {
    console.error("Error fetching reels:", error);
 
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};
 
const reelViews = async (req, res) => {
  try {
    const { id ,userId} = req.params; // Get reel ID from URL
    
    if(!id){
      return res.status(404).json({ message: "ReelId is required",success:false});

    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid  id format.",
      });
    }

    const reel = await Reels.findById(id);
    if (!reel) {
      return res.status(404).json({ message: "Reel not found",success:false });
    }
 
    if (!userId) {
      return res.status(400).json({ message: "User ID is required",success:false });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid  userId format.",
      });
    }
    
    const user = await User.findById(userId)
    if(!user){
      return res.status(404).json({ message: "user not found",success:false});
    }
 
    if (!reel.viewers.includes(userId)) {
      reel.views += 1;
      reel.viewers.push(userId);
      await reel.save();
    }
 
    res.status(200).json({ message: "View count updated", views: reel.views });
  } catch (error) {
    console.error("Error updating view count:", error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
};
 
 
// like the reel
 
const likedBy = async (req, res) => {
  try {
    const { id,userId } = req.params; 
  
   
    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid  userId format.",
      });
    }    

    if (!id) {
      return res.status(400).json({ message: "id is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid  id format.",
      });
    } 

    const user = await User.findById(userId)
    if(!user){
      return res.status(404).json({ message: "user not found",success:false});
    }
 
    const reel = await Reels.findById(id);
    if (!reel) {
      return res.status(404).json({ message: "Reel not found" });
    }

    const shop = await ShopDetails.findById(reel.shopId);
 
    const isLiked = reel.likes.some((like) => like.toString() === userId);
 
    const update = isLiked
      ? { $pull: { likes: userId } }
      : { $addToSet: { likes: userId } }; 
 
    const updatedReel = await Reels.findByIdAndUpdate(id, update, { new: true });

    const isUserEngaged = shop.engagement.some((e)=> e.userId.toString() === userId)

    if(!isUserEngaged){
      shop.engagement.push({
        userId:userId,
        engagementType:"like"
      })

      await shop.save()
    }
 
    if(!updatedReel){
      return res.status(400).json({
        message:'failed to like or unlike reel',
        success:false
      })
    }

    if(isLiked){
      const favoriteCart = await Favourite.findOne({userId})
      favoriteCart.likedVideos = favoriteCart.likedVideos.filter(video => !video.equals(id));
      await favoriteCart.save()
      console.log('favoriteCart',favoriteCart)
    }
    else{
      let favoriteCart = await Favourite.findOne({userId})
      if(!favoriteCart){
       
       favoriteCart = new Favourite({
        userId,
        likedVideos:[id]
       })
       await favoriteCart.save()
       console.log('favoriteCart',favoriteCart)
      }
      else{
        if(!favoriteCart.likedVideos.includes(id)){
          favoriteCart.likedVideos.push(id)
          await favoriteCart.save()
          console.log('favoriteCart',favoriteCart)
        }
      }
      
    }
    res.status(200).json({
      message: isLiked ? "Reel unliked" : "Reel liked",
      likes: updatedReel.likes.length,
    });
  } catch (error) {
    console.error("Error liking reel:", error);
    res.status(500).json({ message: "Error liking reel", error: error.message });
  }
};
 
 
 
// share reel
const shareReel = async (req, res) => {
  try {
    
    const { reelId ,senderId} = req.params;
 
 
 
    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(senderId) || 
        !mongoose.Types.ObjectId.isValid(reelId)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }
 
    // Find sender, recipient, and reel
    const sender = await User.findById(senderId);
    const reel = await Reels.findById(reelId);
 
    if (!sender) return res.status(404).json({ success: false, message: "Sender not found" });
    if (!reel) return res.status(404).json({ success: false, message: "Reel not found" });
 
    reel.shares.push(sender)
    const updatedReel = await reel.save();
   
    if(!updatedReel){
      return res.status(400).json({
        success: false,
        message: "failed to share reel",
      });
    }
    return res.status(200).json({
      success: true,
      message: "Reel shared successfully",
      data:updatedReel,
    });
  } catch (error) {
    console.error("Error sharing reel:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};
 
 
 const getReelById = async (req,res)=>{
  try{
const {reelId,userId} = req.params
  if(!reelId || !userId){
    return res.status(400).json({
      message:'reelId and userId is required',
      success:false
    })
  }

  
  if (!mongoose.Types.ObjectId.isValid(reelId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid  reelId format.",
    });
  } 

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid  userId format.",
    });
  } 
  
  const reel = await Reels.findById(reelId).populate("user","name image")

  if(!reel){
    return res.status(400).json({
      message:'reel not found',
      success:false
    })
  }

  const user = await User.findById(userId)

  if(!user){
    return res.status(400).json({
      message:'user not found',
      success:false
    })
  }
   const shareableLink = `${process.env.BASE_URL || 'https://neargud-be.onrender.com'}/api/user/reel/getReelById/${reel._id}`
   const isLiked = reel.likes?.some((id) => id.toString() === userId.toString());
   const follower = await Follower.findOne({userId:reel.user})
   const isFollowed = follower?.followers?.some((follower)=> follower.followerId.toString()===userId.toString())
  const updatedReel = {...reel.toObject(),shareableLink,isLiked,isFollowed}

  return res.status(200).json({
    message:'reel fetched successfully',
    success:true,
    data:updatedReel,
  })

  }
  catch(error){
    console.error("Error sharing reel:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
 }

 const deleteReel = async (req, res) => {
  try {
    const { reelId } = req.params;

    if(!reelId){
      return res.status(400).json({
        message:'reelId is required',
        success:false
      })
    }

    if (
    !mongoose.Types.ObjectId.isValid(reelId)) {
  return res.status(400).json({ success: false, message: "Invalid reelId format" });
}

    const reel = await Reels.findById(reelId);
    
    if (!reel) {
      return res.status(404).json({ message: "Reel not found" ,success:false});
    }
    
    const deletedReel =  await Reels.findByIdAndDelete(reelId);
    if(deletedReel){
      //delete reel from cloudinary
      const videoPublicId = deletedReel.videoUrl.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/"); 
      await cloudinary.uploader.destroy(videoPublicId);
      //delete reel from favourite cart
     await Favourite.updateMany(
      { likedVideos: reelId },
      { $pull: { likedVideos: reelId } }
    );
    }
    return res.status(200).json({ message: "Reel deleted successfully",success:true });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


// Create a comment on a reel
const createComment = async (req, res) => {
  try {
    const { reelId, text, userId } = req.body;
 
    const reel = await Reels.findById(reelId);
    if (!reel) {
      return res
        .status(404)
        .json({ success: false, message: "Reel not found" });
    }
 
    const newComment = {
      user: userId,
      text,
      createdAt: new Date(),
    };
 
    reel.comments.push(newComment);
    await reel.save();
 
    // Populate user for the latest comment
    const updatedReel = await Reels.findById(reelId).populate(
      "comments.user",
      "name image"
    );
 
    const lastComment = updatedReel.comments[updatedReel.comments.length - 1];
 
    res.status(201).json({
      success: true,
      data: lastComment,
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create comment",
      error: error.message,
    });
  }
};
 
 
const replyToComment = async (req, res) => {
  try {
    const { reelId, commentId, text, userId } = req.body;
 
    const reel = await Reels.findById(reelId);
    if (!reel) {
      return res.status(404).json({ success: false, message: "Reel not found" });
    }
 
    const comment = reel.comments.find(c => c._id.toString() === commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }
 
    const reply = {
      user: userId,
      text,
      createdAt: new Date()
    };
 
    comment.replies.push(reply);
    await reel.save();
 
    const updatedReel = await Reels.findById(reelId)
  .populate({
    path: "comments.user",
    select: "name image"
  })
  .populate({
    path: "comments.replies.user",
    select: "name image"
  });
;
 
    const updatedComment = updatedReel.comments.find(c => c._id.toString() === commentId);
 
    res.status(201).json({
      success: true,
      data: updatedComment
    });
  } catch (error) {
    console.error("Error replying to comment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reply to comment",
      error: error.message
    });
  }
};
 
const getReelComments = async (req, res) => {
  try {
    const { reelId } = req.params;
 
    const reel = await Reels.findById(reelId)
      .populate("comments.user", "name image")
      .populate("comments.replies.user", "name image");
 
    if (!reel) {
      return res.status(404).json({
        success: false,
        message: "Reel not found"
      });
    }
 
    const comments = reel.comments
      .sort((a, b) => b.createdAt - a.createdAt) // Latest comments first
      .map(comment => ({
        _id: comment._id,
        user: comment.user,
        text: comment.text,
        createdAt: comment.createdAt,
        replies: comment.replies
          .sort((a, b) => a.createdAt - b.createdAt) // Oldest replies first
          .map(reply => ({
            _id: reply._id,
            user: reply.user,
            text: reply.text,
            createdAt: reply.createdAt
          }))
      }));
 
    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments
    });
 
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch comments",
      error: error.message
    });
  }
};
 
 
const deleteComment = async (req, res) => {
  try {
    const { reelId, commentId,userId } = req.params;
   
 
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }
 
    if (!mongoose.Types.ObjectId.isValid(reelId) || !mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ success: false, message: "Invalid reelId or commentId format" });
    }
 
    const reel = await Reels.findById(reelId);
    if (!reel) {
      return res.status(404).json({ success: false, message: "Reel not found" });
    }
 
    //delete comment from reel
    const commentIndex = reel.comments.findIndex(c => c._id.toString() === commentId);
    if (commentIndex === -1) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    // check if user is the owner of the comment
    if (!reel.comments[commentIndex].user.toString() === userId) {
      return res.status(403).json({ success: false, message: "User is not authorized to delete this comment" });
    }
    reel.comments.splice(commentIndex, 1);
 
    await reel.save();
 
    return res.status(200).json({ success: true, message: "Comment  deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    return res.status(500).json({ success: false, message: "Failed to delete comment/reply", error: error.message });
  }
};
 

//delete reply from a comment

const deleteReply = async (req, res) => {
  try {
    const { reelId, commentId, replyId, userId } = req.params;
 
    if (!userId) {
      return res.status(400).json({ success: false, message: "User ID is required" });
    }
    if (!mongoose.Types.ObjectId.isValid(reelId) || !mongoose.Types.ObjectId.isValid(commentId) || !mongoose.Types.ObjectId.isValid(replyId)) {
      return res.status(400).json({ success: false, message: "Invalid reelId, commentId or replyId format" });
    }
    const reel = await Reels.findById(reelId);
    if (!reel) {
      return res.status(404).json({ success: false, message: "Reel not found" });
    }
    const comment = reel.comments.find(c => c._id.toString() === commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }
    const replyIndex = comment.replies.findIndex(r => r._id.toString() === replyId);
    if (replyIndex === -1) {
      return res.status(404).json({ success: false, message: "Reply not found" });
    }
    // check if user is the owner of the reply

    if (!comment.replies[replyIndex].user.toString() === userId) {
      return res.status(403).json({ success: false, message: "User is not authorized to delete this reply" });
    }
    comment.replies.splice(replyIndex, 1);
    await reel.save();
    return res.status(200).json({ success: true, message: "Reply deleted successfully" });
  } catch (error) {
    console.error("Error deleting reply:", error);
    return res.status(500).json({ success: false, message: "Failed to delete reply", error: error.message });
  }

  };

// delete a reel
module.exports = {
  createReel,
  getReels,
  getReelsByUserId,
  likedBy,
  reelViews,
  shareReel,
  getReelsByUserId,
  getReelById,
  deleteReel,
  createComment,
  replyToComment,
  getReelComments,
  deleteComment,
  deleteReply
};