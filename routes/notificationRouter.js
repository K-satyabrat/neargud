const express = require("express");
const notificationRouter = express.Router();
 
const multer = require("multer");
const { storage } = require("../utils/cloudinary");
const { createNotification, getNotificationsByStatus, getAllNotifications, getNotificationById, markNotificationAsRead } = require("../controllers/notificationController");
 
const upload = multer({ storage });
 
notificationRouter.post('/createNotification',upload.fields([{ name: 'image' }]), createNotification);
notificationRouter.get('/getAllNotificationsByStatus',getNotificationsByStatus)
notificationRouter.get("/getAllNotifications/:userId", getAllNotifications);
notificationRouter.get("/getNotificationById/:id", getNotificationById);
notificationRouter.put("/markNotificationAsRead/:notificationId/:userId", markNotificationAsRead);
 
 
module.exports = notificationRouter;