const { default: mongoose } = require("mongoose");
const Follower = require("../models/follewerModel");
const Story = require("../models/storyModel");
const SubscriptionPlan = require("../models/subscriptionModel");
const User = require("../models/userModel");
const cloudinary = require("cloudinary").v2;

 
 
const createStory = async (req, res) => {
  try {
   
    const { caption ,user} = req.body;
 
    // Validate required fields
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

     if (!mongoose.Types.ObjectId.isValid(user)) {
            return res.status(400).json({
              success: false,
              message: "Invalid user ID format.",
            });
          }
 
    // Check if the user exists
    const businessUser = await User.findById(user);
    if (!businessUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
 
    // Only business users can upload stories
    if (businessUser.accountType !== "business") {
      return res.status(401).json({
        success: false,
        message: "Only business accounts can upload stories.",
      });
    }
 
    // Check subscription plan
    const subscribedUser = await SubscriptionPlan.findOne({ userId: user });
 
    // If no active subscription, deny access
    const currentDate = new Date();
    console.log('subscribedUser', subscribedUser)
    if (!subscribedUser || subscribedUser.endDate < currentDate) {
      return res.status(401).json({
        message: "Your subscription has expired. Please renew to upload reels.",
        success: false,
      });
    }
 
    // Check if a file is uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please upload an image or video.",
      });
    }
 
    let mediaUrl = req.file.path;
    let mediaType;
 
    // Determine media type based on MIME type
    if (req.file.mimetype.startsWith("image/")) {
      mediaType = "image";
    } else if (req.file.mimetype.startsWith("video/")) {
      mediaType = "video";
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Only images and videos are allowed.",
      });
    }
 
    // Create the story
    const story = new Story({
      user: user,
      mediaUrl,
      mediaType,
      caption: caption || "",
    });
 
    const createdStory =await story.save();

    if(createdStory) {
      //delete story from cloudinary after 24 hours
      const publicId = createdStory.mediaUrl.split("/").pop().split(".")[0]; // Extract public ID from the URL
      setTimeout(async () => {
        await cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) {
            console.error("Error deleting image from Cloudinary:", error);
          } else {
            console.log("Image deleted from Cloudinary:", result);
          }
        });
      }, 86400000); // 24 hours in milliseconds
      
    }
 
    res.status(201).json({
      success: true,
      message: "Story uploaded successfully",
      story:createdStory,
    });
  } catch (error) {
    console.error("Error creating story:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
 
 
const getStories = async (req, res) => {
  try {
const {userId} = req.params

if(!userId){
    return res.status(400).json({
        message:'userId is required',
        success:false
    })
}

if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid user ID format.",
    });
  }


const user = await User.findById(userId)

if(!user){
    return res.status(404).json({
        message:'user not found',
        success:false
    })
}

const followings = await Follower.find({ "followers.followerId": userId }).select("userId");

if (!followings.length) {
  return res.status(200).json({
     message:'stories fetched successfully',
    success: true,
    stories: [],
  });
}

const followingsIds = followings.map(f => f.userId.toString());  

 
const stories = await Story.aggregate([
  {
    $match: {
      user: { $in: followingsIds.map(id => new mongoose.Types.ObjectId(id)) },
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    },
  },
  {
    $sort: { createdAt: -1 },
  },
  {
    $group: {
      _id: "$user",
      stories: { $push: "$$ROOT" },
    },
  },
  {
    $lookup: {
      from: "users",
      localField: "_id",
      foreignField: "_id",
      as: "userDetails",
    },
  },
  {
    $unwind: "$userDetails",
  },
  {
    $project: {
      _id: 0,
      user: {
        _id: "$userDetails._id",
        username: "$userDetails.username",
        image: "$userDetails.image",
      },
      stories: 1,
    },
  },
]);

  
  const personalstories = await Story.aggregate([
    {
      $match: {
        user: new mongoose.Types.ObjectId(userId),
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $group: {
        _id: "$user",
        stories: { $push: "$$ROOT" },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $unwind: "$userDetails",
    },
    {
      $project: {
        _id: 0,
        user: {
          _id: "$userDetails._id",
          username: "$userDetails.username",
          image: "$userDetails.image",
        },
        stories: 1,
      },
    },
  ]);
  
 
    res.status(200).json({
     message:'stories fetched successfully',
      success: true,
      personalstories,
      storiesData: stories,
    });
  } catch (error) {
    console.error("Error fetching stories:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
 
 
 
const viewStory = async (req, res) => {
  try {
    const { storyId ,userId} = req.params;
    
 
    // Validate input
    if (!storyId || !userId) {
      return res.status(400).json({ success: false, message: "Story ID and User ID are required" });
    }


    if (!mongoose.Types.ObjectId.isValid(storyId) || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID format or invalid story ID format.",
        });
      }
 
    // Check if the story exists
    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }
 
    // Check if the user exists
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
 
    // Check if the user has already viewed the story
    const alreadyViewed = story.viewers.some(viewer => viewer.user.toString() === userId);
    const isStoryCreateor = story.user.toString() === userId.toString()
 
    if (!alreadyViewed && !isStoryCreateor) {
      story.viewers.push({ user: userId, viewedAt: new Date() });
      await story.save();
    }
 
    res.status(200).json({
      success: true,
      message: "Story viewed successfully",
      storyId: story._id,
      viewersCount: story.viewers.length, 
    });
  } catch (error) {
    console.error("Error viewing story:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
 
 
const getStoryViewCount = async (req, res) => {
  try {
   
    const {storyId, userId } = req.params; 
 
    // Validate input
    if (!storyId || !userId) {
      return res.status(400).json({ success: false, message: "Story ID and User ID are required" });
    }
 
    
    if (!mongoose.Types.ObjectId.isValid(storyId) || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID format or invalid story ID format.",
        });
      }

      const userExists = await User.findById(userId);
      if (!userExists) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
    // Fetch the story
    const story = await Story.findById(storyId).populate("viewers.user", "userName image");
    if (!story) {
      return res.status(404).json({ success: false, message: "Story not found" });
    }
 
    // Ensure only the story owner can view the count
    if (story.user.toString() !== userId) {
      return res.status(403).json({ success: false, message: "You are not authorized to view this story's views" });
    }
 
    // Extract viewers list
    const viewers = story.viewers.map(viewer => ({
      userId: viewer.user._id,
      username: viewer.user.username,
      profilePicture: viewer.user.profilePicture,
      viewedAt: viewer.viewedAt
    }));
 
    res.status(200).json({
      success: true,
      storyId: story._id,
      totalViews: story.viewers.length, 
      viewers, 
    });
  } catch (error) {
    console.error("Error fetching story view count:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
 
 
 
const deleteStory = async (req, res) => {
  try {
    const { storyId, userId} = req.params;
 
    // Validate required fields
    if (!storyId || !userId) {
      return res.status(400).json({
        success: false,
        message: "Story ID and User ID are required.",
      });
    }


    
    if (!mongoose.Types.ObjectId.isValid(storyId) || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID format or invalid story ID format.",
        });
      }
 

      const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    // Find the story by ID
    const story = await Story.findById(storyId);
 
    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Story not found.",
      });
    }

    console.log('story',story.user)
    console.log('userId',userId)
 
    // Check if the user trying to delete the story is the owner
    if (story.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this story.",
      });
    }
 
    // Delete the story
    const deletedStory =await Story.findByIdAndDelete(storyId);
    if(deletedStory) {
      //delete story from cloudinary
      const publicId = deletedStory.mediaUrl.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/"); 
      await cloudinary.uploader.destroy(publicId);
    }
 
    res.status(200).json({
      success: true,
      message: "Story deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting story:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
 
 
module.exports = { createStory,getStories,viewStory,getStoryViewCount,deleteStory };