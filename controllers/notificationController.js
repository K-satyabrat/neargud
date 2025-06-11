const { default: mongoose } = require("mongoose");
const Notification = require("../models/notificationModel");
const User = require("../models/userModel");
const { sendNotification } = require("../utils/socketHandler");
 
const createNotification = async (req, res) => {
  try {
    const { title, description, sendCategory } = req.body;

 
    // Validate required fields
    if (  !title || !description || !sendCategory) {
      return res.status(400).json({
        success: false,
        message: "Some fields are missing.",
      });
    }
    let imageUrl = null;
 
    // Handle image upload
    if (req.files && req.files.image) {
      imageUrl = req.files.image[0].path;
    }
 
    if(!imageUrl){
      return res.status(400).json({
        message:"image required",
        success:false,
      })
    }
    // Create a new notification in db
    const notification = await Notification.create({
      title,
      description,
      imageUrl,
      sendCategory
    });

    
    sendNotification(notification, sendCategory);
    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification,
    });
    
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};
 
const getNotificationsByStatus = async (req, res) => {
  try {
    const { status, limit = 10, page = 1 ,userLimit} = req.query;
    const currentPage = parseInt(page);

    // Fetch notifications with pagination
    const notifications = await Notification.find().sort({ createdAt: -1 })
      .populate("readBy", "name image") // Populate readBy field with user data
      .limit(parseInt(limit))
      .skip((currentPage - 1) * parseInt(limit));

    const data = [];
    const allUsers = await User.find({}, "name image"); // Fetch all users once

    notifications.forEach((notification) => {
      const readUsers = notification.readBy.map((user) => ({
        user_name: user.name,
        user_id:user._id,
        user_image: user.image,
        notification_id:notification._id,
        notification_title: notification.title,
        notification_description: notification.description,
        notification_date: notification.createdAt,
        read: true,
      }));

      const unreadUsers = allUsers
        .filter((user) => !notification.readBy.some((readUser) => readUser._id.equals(user._id)))
        .map((user) => ({
          user_id:user._id,
          user_name: user.name,
          user_image: user.image,
          notification_id:notification._id,
          notification_title: notification.title,
          notification_description: notification.description,
          notification_date: notification.createdAt,
          read: false,
        }));

      if (status === "all") {
        data.push(...readUsers, ...unreadUsers);
      } else if (status === "read") {
        data.push(...readUsers);
      } else if (status === "unread") {
        data.push(...unreadUsers);
      }
    });
   
     let filterData =data
     if(userLimit){
       filterData = data.slice(0,userLimit)
     }
     
    
    const totalRecords = await Notification.countDocuments(); // Get total count
    const totalPage = Math.ceil(totalRecords / parseInt(limit));

    res.status(200).json({
      success: true,
      message: "Data fetched successfully",
      data:filterData,
      totalRecords,
      totalPage,
      hasNextPage: currentPage < totalPage,
      hasPrevPage: currentPage > 1,
      page: currentPage,
    });

  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};



  const getAllNotifications = async (req, res) => {
    try {
      const {userId} = req.params
      const { page = 1, limit = 10 } = req.query;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: "userId is not provided.",
        });
      }
      const user = await User.findById(userId)
      if(!user){
        return res.status(400).json({
          message:'user not found',
          success:false,
        })
      }
      const userCategory = user.accountType==='business'?'businesses':'customers';
      const notifications = await Notification.find({
        sendCategory: userCategory,
      }).sort({ createdAt: -1 })
        .select("title imageUrl description createdAt")
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
   
      const total = await Notification.countDocuments({
        sendCategory: userCategory,
      });
   
      res.status(200).json({
        success: true,
        message: "Notifications fetched successfully",
        data: notifications,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        message: "Internal server error",
        success: false,
      });
    }
  };
  const getNotificationById = async (req, res) => {
    try {
      const { id } = req.params;
      // Validate the id format
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Notification ID format.",
        });
      }
      const notification = await Notification.findById(id);
   
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }
   
      res.status(200).json({
        success: true,
        message: "Notification fetched successfully",
        data: notification,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        message: "Internal server error",
        success: false,
      });
    }
  };
  const markNotificationAsRead = async (req, res) => {
    try {
      const { notificationId, userId } = req.params;
   
      // Validate the notificationId and userId format
      if (!mongoose.Types.ObjectId.isValid(notificationId) || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid Notification ID or User ID format.",
        });
      }
      // Find the notification by ID
      const notification = await Notification.findById(notificationId);
      if (!notification) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }
   
      // Check if the user has already read the notification
      if (notification.readBy.includes(userId)) {
        return res.status(400).json({
          success: false,
          message: "Notification already marked as read by this user.",
        });
      }
   
      // Mark the notification as read by adding the userId to the readBy array
      notification.readBy.push(userId);
      await notification.save();
   
      res.status(200).json({
        success: true,
        message: "Notification marked as read successfully",
        data: notification,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        message: "Internal server error",
        success: false,
      });
    }
  };
 
module.exports = { createNotification ,getNotificationsByStatus,getAllNotifications,markNotificationAsRead,getNotificationById};