const Chat = require("../models/chatModel");
const NewMessage = require("../models/messageModel");
const { emitMessageSend, emitMessageDelete, emitMessageEdit } = require("../utils/socketHandler");
const mongoose = require('mongoose');
const cloudinary = require("cloudinary").v2;
 
const createMessage = async (req, res) => {
  try {
    const { chatId, sender, content } = req.body;
    const attachment = req.file ? req.file.path : null;
    // Validate chatId
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chatId", success: false });
    }
    if (!mongoose.Types.ObjectId.isValid(sender)) {
      return res.status(400).json({ message: "Invalid senderId", success: false });
    }
    if (!chatId || !sender || (!content && !attachment)) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }
    
    const chat = await Chat.findById(chatId)

    if(!chat){
      return res.status(404).json({
        message:'chat not found',
        success:false,
      })
    }

    if(!chat.isGroup){
      if(chat.isBlock){
        return res.status(400).json({
          message:'this chat has blocked',
          success:false,
        })
      }
    }
    const message = new NewMessage({
      chatId,
      sender,
      content,
      attachment,
      readBy:[{userId:sender}]
    });
 
    await message.save();
 
    // Populate sender's image after saving
    const populatedMessage = await NewMessage.findById(message._id)
      .populate("sender", "image name"); // Assuming `image` and `name` fields exist in User model
 
   
    emitMessageSend(chat, populatedMessage);
 
    res
      .status(201)
      .json({ success: true, message: "Message sent", data: populatedMessage });
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
 
 
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params; // Get message ID from URL params
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid Id", success: false });
    }
    if (!messageId) {
      return res
        .status(400)
        .json({ success: false, message: "Message ID is required" });
    }

    const message = await NewMessage.findById(messageId)

    if(message.status=== "deleted"){
      return res.status(400).json({
        message:'this message already deleted',
        success:false,
      })
    }
 
    const updatedMessage = await NewMessage.findByIdAndUpdate(
      messageId,
      { status: "deleted", content: "[Message deleted]", attachment: null }, // Hides content
      { new: true }
    ).populate("sender", "image name"); // Populate sender's image and name
 
    if (!updatedMessage) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });
    }
 
    const chat = await Chat.findById(updatedMessage.chatId);
    emitMessageDelete(chat, updatedMessage);
 
    res.status(200).json({
      success: true,
      message: "Message deleted",
      data: updatedMessage,
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
 
 
const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid message Id", success: false });
    }
    if (!messageId) {
      return res
        .status(400)
        .json({ success: false, message: "Message ID and message is required" });
    }
    const message = await NewMessage.findById(messageId);
    if (!message) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });
    }

    
    if(message.status=== "deleted"){
      return res.status(400).json({
        message:'this message already deleted',
        success:false,
      })
    }
    // Update message fields
    if (content) {
      message.content = content || message.content;
      message.status = "edited"
    }
    let newAttachment;
    if (newAttachment) {
     // delete previous attachment from cloudinary if exists
      if (message.attachment) {
        const publicId = message.attachment.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/");  // Extract public ID from URL
        await cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) {
            console.error("Error deleting image from Cloudinary:", error);
          } else {
            console.log("Image deleted from Cloudinary:", result);
          }
        });
      }
      message.attachment = newAttachment || message.attachment;
      message.status = "edited"
    }
 
    await message.save();
 
    // Populate sender's image after saving
    const updatedMessage = await NewMessage.findById(message._id)
      .populate("sender", "image name"); // Populating sender's image and name
 
    const chat = await Chat.findById(message.chatId);
    emitMessageEdit(chat, updatedMessage);
 
    res.status(200).json({
      success: true,
      message: "Message updated successfully",
      data: updatedMessage,
    });
  } catch (error) {
    console.error("Error updating message:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
 
 
const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 10 } = req.query; // Default: Page 1, 10 messages per page
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chat Id", success: false });
    }
    if (!chatId) {
      return res
        .status(400)
        .json({ success: false, message: "Chat ID is required" });
    }
 
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
 
    const totalMessages = await NewMessage.countDocuments({ chatId }); // Get total messages count
    const totalPages = Math.ceil(totalMessages / limitNum); // Calculate total pages
 
    if (pageNum > totalPages && totalPages !== 0) {
      return res
        .status(404)
        .json({ success: false, message: "No more messages to fetch" });
    }
 
    const messages = await NewMessage.find({ chatId })
      .populate("sender", "name image")
      .sort({ createdAt: -1 }) // Fetch messages in chronological order
      .skip((pageNum - 1) * limitNum) // Skip messages for pagination
      .limit(limitNum)
    // Process messages to avoid repeating sender image/name for consecutive messages
    let processedMessages = [];
    let lastSenderId = null;
 
    messages.forEach((msg) => {
      let messageData = {
        ...msg._doc,
      };
 
      if (msg.sender && msg.sender._id) {
        if (msg.sender._id.toString() !== lastSenderId) {
          // First message from a new sender includes name & image
          messageData.sender = {
            _id: msg.sender._id,
            name: msg.sender.name,
            image: msg.sender.image,
          };
        } else {
          // Continuous messages from the same sender won't have redundant details
          messageData.sender = { _id: msg.sender._id };
        }
        lastSenderId = msg.sender._id.toString();
      } else {
        // Handle missing sender (e.g., deleted user)
        messageData.sender = {
          _id: null,
          name: "Unknown User",
          image: "default-profile.png", // Set a default image
        };
      }
 
      processedMessages.push(messageData);
    });
 
 
    res.status(200).json({
      success: true,
      currentPage: pageNum,
      totalPages,
      totalMessages,
      hasPrevPage: pageNum > 1,
      hasNextPage: pageNum < totalPages,
      prevPage: pageNum > 1 ? pageNum - 1 : null,
      nextPage: pageNum < totalPages ? pageNum + 1 : null,
      data: processedMessages,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
 
 
const markMessageAsRead = async (req, res) => {
  try {
    const { messageId, userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(userId) && !mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: "Invalid user and message Id's", success: false });
    }
    if (!messageId || !userId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Message ID and User ID are required",
        });
    }
 
    const updatedMessage = await NewMessage.findByIdAndUpdate(
      messageId,
      {
        $addToSet: { readBy: { userId, readAt: new Date() } }, // Ensures userId is added only once
      },
      { new: true } // Returns the updated message
    );
 
    if (!updatedMessage) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });
    }
 
    res
      .status(200)
      .json({
        success: true,
        message: "Message marked as read",
        data: updatedMessage,
      });
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
 
module.exports = {
  createMessage,
  deleteMessage,
  markMessageAsRead,
  getMessages,
  editMessage
};