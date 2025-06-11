const express = require("express");
const messageRouter = express.Router();
 
 
// Middleware for file uploads (if needed for attachments)
const multer = require("multer");
const { storage } = require("../utils/cloudinary.js");
const { createMessage, editMessage, getMessages, markMessageAsRead, deleteMessage } = require("../controllers/messageController.js");
const upload = multer({ storage }); // You can configure this as per your storage setup
 
messageRouter.post("/createMessage", upload.single("attachment"), createMessage);
 
messageRouter.get("/getMessages/:chatId", getMessages);
messageRouter.put("/editMessage/:messageId",upload.single("attachment"), editMessage);
 
messageRouter.put("/markMessageAsRead/:messageId/:userId", markMessageAsRead);
 
messageRouter.delete("/deleteMessage/:messageId", deleteMessage);
 
module.exports = messageRouter;