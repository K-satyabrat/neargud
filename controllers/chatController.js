const Chat = require("../models/chatModel");
const Follower = require("../models/follewerModel");
const NewMessage = require("../models/messageModel");
const User = require("../models/userModel");
const { emitMemberAdded, emitChatDetailsUpdated, emitMemberRemoved, emitMemberLeft, emitNewChat, emitChatDelete } = require("../utils/socketHandler");
const mongoose = require('mongoose');
const cloudinary = require("cloudinary").v2;
 
 
 
const createGroupChat = async (req, res) => {
  try {
    let { groupName, admin, participants } = req.body;
 
    // Validation: Ensure required fields are provided
    if (!groupName || !admin || !participants) {
      return res.status(400).json({
        message: "Group name, admin, and participants are required.",
        status: false,
      });
    }
 
    if (!mongoose.Types.ObjectId.isValid(admin)) {
      return res.status(400).json({ message: "Invalid admin ID", success: false });
    }
 
    const user = await User.findById(admin);
    if (!user) {
      return res.status(400).json({
        message: "Admin user not found",
        success: false,
      });
    }
 
    // Handle participants input (convert from string if needed)
    if (typeof participants === "string") {
      try {
        participants = JSON.parse(participants.replace(/'/g, '"'));
      } catch (error) {
        return res.status(400).json({
          message: "Invalid participants format. Must be a JSON array.",
          status: false,
        });
      }
    }
 
    // Ensure participants is an array
    if (!Array.isArray(participants)) {
      return res.status(400).json({
        message: "Participants must be an array.",
        status: false,
      });
    }
 
    // Check if the group has at least 3 members (including admin)
    if (participants.length < 2) {
      return res.status(400).json({
        message: "At least three members (including the admin) are required in a group.",
        status: false,
      });
    }
 
    // Check if all participant IDs are valid
    const isInvalidId = participants.some((id) => !mongoose.Types.ObjectId.isValid(id));
    if (isInvalidId) {
      return res.status(400).json({
        message: "Some IDs in participants are invalid",
        success: false,
      });
    }
 
    // Validate if all participant IDs exist in the User collection
    const existingUsers = await User.find({ _id: { $in: participants } });
    if (existingUsers.length !== participants.length) {
      return res.status(400).json({
        message: "One or more participant IDs are invalid.",
        status: false,
      });
    }
 
    // Handle group image upload properly
    let groupImage = null;
    if (req.file) {
      groupImage = req.file.path; // If using upload.single("image")
    } else if (req.files?.image) {
      groupImage = req.files.image[0].path; // If using upload.fields([{ name: "image" }])
    }
 
    // Create new group chat
    const newGroupChat = new Chat({
      isGroup: true,
      admin,
      groupName,
      groupImage,
      participants: participants.includes(admin) ? [...participants] : [...participants, admin],
    });
 
    const savedChat = await newGroupChat.save();
    emitNewChat(savedChat);
 
    res.status(201).json({
      message: "Group created successfully",
      data: savedChat,
      status: true,
    });
 
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error", status: false, error });
  }
};
 
 
// Update Group Chat Controller
const updateGroupChat = async (req, res) => {
  try {
    const { chatId, userId } = req.params;
    let { groupName, participants } = req.body;
    if (!mongoose.Types.ObjectId.isValid(chatId) && !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid chat and user Id", success: false });
    }
    // Find the chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Group chat not found' });
    }
 
    // Check if the requester is the group admin
    if (chat.admin.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Only the admin can update the group chat' });
    }
 
    // Update group image if a new file is uploaded
    if (req.files?.image?.length > 0) {
      // Delete the old image from Cloudinary if it exists
      if (chat.groupImage) {
        const publicId = chat.groupImage.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/");  // Extract public ID from the URL
        await cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) {
            console.error("Error deleting image from Cloudinary:", error);
          } else {
            console.log("Image deleted from Cloudinary:", result);
          }
        });
      }
      chat.groupImage = req.files.image[0].path;
    }
 
    // Update group name
    if (groupName) chat.groupName = groupName;
    let filteredAddedUsers = []
    let filteredRemovedUsers = []
 
    // Update participants list
    if (participants && Array.isArray(participants)) {

      const isAdmin = participants.some((id)=> id.toString()=== chat.admin.toString())
      if(!isAdmin){
        
        participants=[...participants,chat.admin.toString()]
      }
      
      const validUsers = await User.find({ _id: { $in: participants } });
      if (validUsers.length !== participants.length) {
        return res.status(400).json({
          message: "One or more participant IDs are invalid.",
          status: false,
        });
      }
 
      if (validUsers.length < 3) {
        return res.status(400).json({
          message: "Group must have at least three members",
          status: false,
        });
      }

      const isInvalidId = participants.some((id) => !mongoose.Types.ObjectId.isValid(id));

      if (isInvalidId) {
        return res.status(400).json({
          message: 'Some IDs in participants are invalid',
          success: false,
        });
      }
     
     
      const existingParticipants = new Set(chat.participants.map(id => id.toString()));
      const newParticipants = new Set(validUsers.map(user => user._id.toString()));
 
      // Find added users
      const addedUsers = validUsers.filter(user => !existingParticipants.has(user._id.toString()));
      if (addedUsers.length > 0) {
        filteredAddedUsers = addedUsers.map((user) => {
          const { image, name, _id } = user
          return { image, name, _id }
        })
 
      }
 
      // Find removed users
      const removedUsers = chat.participants.filter(id => !newParticipants.has(id.toString()));
      if (removedUsers.length > 0) {
       const deletedMessages= await NewMessage.deleteMany({
          chatId: chat._id,
          sender: { $in: removedUsers },
        });
        if(deletedMessages && deletedMessages.length>0){
          for (let message of deletedMessages) {
            if(message.attachment) {
            const publicId = message.attachment.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/"); // Extract public ID from the URL
            await cloudinary.uploader.destroy(publicId, (error, result) => {
              if (error) {
                console.error("Error deleting image from Cloudinary:", error);
              } else {
                console.log("Image deleted from Cloudinary:", result);
              }
            });
          }
          }
        }

        filteredRemovedUsers = await Promise.all(removedUsers.map(async (user) => await User.findById(user).select('name image')))
      }
 
      // Update chat participants
      chat.participants = validUsers.map(user => user._id);
    }
 
    // Save the updated chat
    const updatedChat = await chat.save();
 
    if (filteredAddedUsers && filteredAddedUsers.length > 0) {
      filteredAddedUsers.forEach((user) => {
 
        emitMemberAdded(chat, user)
      })
    }
    if (filteredRemovedUsers && filteredRemovedUsers.length > 0) {
      filteredRemovedUsers.forEach((user) => {
 
        emitMemberRemoved(chat, user)
      })
    }
 
    if (groupName) {
      emitChatDetailsUpdated(chat, updatedChat)
    }
 
    if (req.files?.image?.length > 0) {
      emitChatDetailsUpdated(chat, updatedChat)
    }
    res.status(200).json({ message: 'Group chat updated successfully', data: updatedChat });
  } catch (error) {
    console.error(error); // Log error for debugging
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
 
 
 
const leaveGroup = async (req, res) => {
  try {
    const { chatId, userId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(chatId) && !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid chat and user Id", success: false });
    }
    const chat = await Chat.findById(chatId);
 
    if (!chat) {
      return res
        .status(404)
        .json({ message: "Chat not found", success: false });
    }
 
    const user = await User.findById(userId).select("image name")
 
    if (!user) {
      return res
        .status(400)
        .json({ message: "user not found", success: false });
    }
    const isParticipant = chat.participants.some((id) => id.toString() === userId.toString());

    if (!isParticipant) {
      return res.status(400).json({
        message: 'User is not a participant of the chat',
        success: false
      });
    }
    
    // If the group admin leaves and there are remaining participants, assign a random admin
    if (chat.admin?.toString() === userId) {
            const otherBusinessUsers = await User.find({
              _id: { $in: chat.participants, $ne: userId },
              accountType: "business"
            });
   
            if (otherBusinessUsers.length > 0) {
              chat.admin = otherBusinessUsers[0]._id; // Assign new admin

            } else {
              await NewMessage.deleteMany({chatId:chatId})
             const deleteChat= await Chat.findByIdAndDelete(chatId);
             emitChatDelete(chatId,deleteChat) // No business users left, delete chat
              res.status(200).json({ message: "Admin removed and  Chat and related messages deleted successfully", success: true ,data:deleteChat});
            }
          }
    // Remove the user from participants
    chat.participants = chat.participants.filter(
      (participant) => !participant.equals(userId)
    );
 
    // If only one participant is left, convert to a private chat
    if (chat.participants.length === 2) {
      chat.isGroup = false;
      chat.groupName = null;
      chat.groupImage = null;
      chat.admin = null;
    }
    // If only one member in the group, delete the chat
    if (chat.participants.length === 0) {
      await NewChat.findByIdAndDelete(chatId);
      return res
        .status(200)
        .json({ message: "Chat deleted as no participants are left" });
    }
    await chat.save();
    await NewMessage.deleteMany({
      chatId: chatId,
      sender: userId,
    });
    emitMemberLeft(chat, user)
    return res
      .status(200)
      .json({ message: "You have left the group", success: true, data: chat });
  } catch (error) {
    console.error("Error left group:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};
 
 
const getUserDetailsByChatId = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chat Id", success: false });
    }
    const chat = await Chat.findById(chatId);
    // Find the chat by chatId
    if (!chat) {
      return res.status(404).json({ message: "Chat not found", status: false });
    }
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid ID provided.",success:false });
    }
    //  Find all users in the chat using their userId
    const user = await User.find({ _id: { $in: chat.participants } }).select(
      "name image"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" ,success:false});
    }
    return res
      .status(200)
      .json({ message: "User found", status: true, data: user });
  } catch (error) {
    console.error("Error finding a users:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};
 
 
 
const oneToOneChat = async (req, res) => {
  try {
    const { senderId, receiverId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(senderId) && !mongoose.Types.ObjectId.isValid(receiverId)) {
      return res.status(400).json({ message: "Invalid sender and receiver Id", success: false });
    }
    //Check if a one-to-one chat already exists
    if (!senderId || !receiverId) {
      return res.status(400).json({
        message: 'senderId and receiverId are required',
        success: false,
      })
    }
    let chat = await Chat.findOne({
      isGroup: false,
      participants: { $all: [senderId, receiverId] },
    });
 
    const user1 = await User.findById(senderId)
    const user2 = await User.findById(receiverId)
 
    if (!user2 || !user1) {
      return res.status(400).json({
        message: 'senderId or receiverId not found as user',
        success: false,
      })
    }
 
    const checkHasChat = await Chat.findOne({
      participants: { $all: [senderId, receiverId] },
      isGroup: false
    });
 
     
    if (checkHasChat) {
      return res.status(400).json({
        message: `this users already have chat`,
        success: false,
      })
    }
 
    if (!chat) {
      // Create a new one-to-one chat
      chat = new Chat({
        isGroup: false,
        participants: [senderId, receiverId],
        isBlock:false,
      });
      await chat.save();
      emitNewChat(chat)
    }
    return res.status(200).json({
      message: "Chat created successfully",
      success: true,
      data: chat,
    });
  } catch (error) {
    console.error("Error in One-To-On chat:", error);
    return res.status(500).json({
      message: "Internal server error",
      success: false,
    });
  }
};
 
const getAllChatsByStatus = async (req, res) => {
  try {
    const { userId, status ,searchTitle} = req.query;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user Id", success: false });
    }
    if (!userId || !status) {
      return res
        .status(400)
        .json({ message: "User ID and status are required",success:false });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "User Not Found",
        success: false,
      })
    }
    if (!(status === "all" || status === "read" || status === "unread")) {
      return res.status(400).json({ message: "Invalid status", success:false});
    }

    let query = [
      { $match: { participants: { $in: [new mongoose.Types.ObjectId(userId)] }, isBlock: false } }
    ];

    if (searchTitle && typeof searchTitle === 'string') {
      query.push({
      $lookup: {
        from: "users",
        localField: "participants",
        foreignField: "_id",
        as: "participantDetails",
      }
      });

      query.push({
      $match: {
        $or: [
        { "participantDetails.name": { $regex: new RegExp(searchTitle, "i") } },
        { groupName: { $regex: new RegExp(searchTitle, "i") } }
        ]
      }
      });
    }

    const chats = await Chat.aggregate(query);
 
    
    let chatDetails;
    chatDetails = await Promise.all(
      chats.map(async (chat) => {
        const lastMessage = await NewMessage.findOne({
          chatId: chat._id,
        }).sort({ createdAt: -1 });
 
        let lastMessageMod = null;
        let unreadCount = 0;
        if (lastMessage) {
          const sender = await User.findById(lastMessage.sender.toString());
          const senderName = sender ? sender.name : "Unknown";
          lastMessageMod = {
            ...(chat.isGroup && { senderName }), // Include senderName only for group chats
            content: lastMessage.content,
            attachment: lastMessage.attachment,
            isRead: lastMessage.readBy.some(
              (readEntry) => readEntry.userId.toString() === userId
            ),
          };
          if (!lastMessageMod.isRead) {
            unreadCount = await NewMessage.countDocuments({
              chatId: chat._id,
              "readBy.userId": { $ne: userId },
            });
          }
        }
        if (status === "all") {
          if (!chat.isGroup && !lastMessageMod) {
            return null;
          }
        } else if (status === "read") {
          if (!lastMessageMod || !lastMessageMod.isRead) {
            return null;
          }
        } else if (status === "unread") {
          if (!lastMessageMod || lastMessageMod.isRead) {
            return null;
          }
        }
 
        if (chat.isGroup) {
          return {
            chatId: chat._id,
            isGroup: chat.isGroup,
            groupName: chat.groupName,
            groupImage: chat.groupImage,
            lastMessage: lastMessageMod,
            unreadCount,
          };
        } else {
          const otherUserId = chat.participants.find(
            (participant) => participant._id.toString() !== userId
          );
          const otherUser = await User.findById(otherUserId);
          return {
            chatId: chat._id,
            isGroup: chat.isGroup,
            otherUser: {
              name: otherUser ? otherUser.name : "Unknown",
              image: otherUser ? otherUser.image : null,
            },
            lastMessage: lastMessageMod,
            unreadCount,
          };
        }
      })
    );
 
    // Filter out null values (chats that don't match the read/unread criteria)
    chatDetails = chatDetails.filter((chat) => chat !== null);
    
    // Sort chats by last message date (newest first)
    chatDetails.sort((a, b) => {
      const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt) : 0;
      const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt) : 0;
      return dateB - dateA;
    });
 
    if (!chats.length) {
      return res.status(200).json({ message: "No chats found",success:false, data: [] });
    }
 
    res.status(200).json({ success: true, data: chatDetails, message: "chats found" });
  } catch (error) {
    console.error("Error fetching chats by status:", error);
    res.status(500).json({ message: "Server error", error ,success:false});
  }
};
 
// Get group members along with total participants
const getGroupDetails = async (req, res) => {
  try {
    const { chatId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: "Invalid chat Id", success: false });
    }
    // Populate participants with their names and images
    const chat = await Chat.findById(chatId)
      .populate('participants', 'name image')
      .populate('admin', 'name image');
 
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' ,success:false});
    }
    if (chat.isGroup) {
      const groupDetails = {
        _id:chat._id,
        groupName: chat.groupName,
        groupImage: chat.groupImage,
        totalMembers: chat.participants.length,
        members: chat.participants,
        admin: chat.admin,
      };
      return res.status(200).json({ message: 'Group found', data: groupDetails,success:true });
    } else {
      const oneToOneChat = {
        participants: chat.participants,
      };
      return res.status(200).json({ message: 'One-to-one chat found', data: oneToOneChat,success:true });
    }
  } catch (error) {
    console.error("Error fetching group Details:", error);
    res.status(500).json({ message: "Server error", error ,success:false});
  }
};

const getFollowerForChat = async (req,res)=>{
try{
  const {chatId} = req.params
  
  if(!chatId){
    return res.status(400).json({ message: "ChatId required", success: false });
  }
  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    return res.status(400).json({ message: "Invalid chat Id", success: false });
  }
  const chat = await Chat.findById(chatId)

  if(!chat){
    return res.status(400).json({
      message:'chat not found',
      success:false
    })
  }

  if(!chat.isGroup){
    return res.status(400).json({
      message:'it is not group chat ',
      success:false,
    })
  }

  const followers = await Follower.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(chat.admin) } },
    { $unwind: "$followers" },
    {
      $lookup: {
        from: "users",
        localField: "followers.followerId",
        foreignField: "_id",
        as: "followerDetails"
      }
    },
    { $unwind: "$followerDetails" },
    {
      $project: {
        _id: 1,
        "followerDetails._id": 1,
        "followerDetails.name": 1,
        "followerDetails.image": 1
      }
    }
  ]);

  // Filter followers who are not participants of the chat
  const participantIds = chat.participants.map(participant => participant.toString());
  const nonParticipantFollowers = followers.filter(follower => 
    !participantIds.includes(follower.followerDetails._id.toString())
  );

  return res.status(200).json({
    message:'followers fetch successfully',
    success:true,
    data:nonParticipantFollowers
  })
}
catch(error){
  console.error("Error fetching group Details:", error);
  res.status(500).json({ message: "Server error", error:error.message,success:false});
}
}
 
const deleteChatById = async (req, res) => {
  try {
    const { chatId ,adminId} = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(chatId) || !mongoose.Types.ObjectId.isValid(adminId)) {
      return res.status(400).json({ message: "Invalid chat Id or adminId", success: false });
    }
    
  
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found", success: false });
    }

    if(chat.isGroup){
      if(adminId.toString() !== chat.admin.toString()){
         return res.status(400).json({
          message:'only admin have permission to delete group Chat',
          success:false,
         })
      }
    }
   
    
    // Delete messages 
  const deletedMessages=  await NewMessage.deleteMany({ chatId });
  if(deletedMessages && deletedMessages.length>0){
    for (let message of deletedMessages) {
      if(message.attachment) {
      const publicId = message.attachment.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/");  // Extract public ID from the URL
      await cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          console.error("Error deleting image from Cloudinary:", error);
        } else {
          console.log("Image deleted from Cloudinary:", result);
        }
      });
    }
    }
  }    
    // Delete the chat
    await Chat.findByIdAndDelete(chatId);
    
    res.status(200).json({ message: "Chat and related messages deleted successfully", success: true });
  } catch (error) {
    console.error("Error deleting chat:", error);
    res.status(500).json({ message: "Server error", success: false, error });
  }
};

// Controller to block/unblock a chat
const blockChat = async (req, res) => {
  try {
      const { chatId } = req.params;
      const { isBlock } = req.body;
      if (!mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({ message: "Invalid chatId ", success: false });
      }
      if (!chatId || !isBlock) {
        return res
          .status(400)
          .json({ message: "chatId  and isBlock are required",success:false });
      }
      // Find the chat by ID and update the isBlock status
      const chat = await Chat.findByIdAndUpdate(chatId, { isBlock }, { new: true });

      if (!chat) {
          return res.status(404).json({ message: 'Chat not found',success:false });
      }

      res.status(200).json({ message: `Chat has been ${isBlock===true ? 'blocked' : 'unblocked'}`, chat,success:true });
  } catch (error) {
      res.status(500).json({ message: 'Internal Server Error', error: error.message,success:false });
  }
};
 
module.exports = {
  createGroupChat,
  updateGroupChat,
  leaveGroup,
  getUserDetailsByChatId,
  oneToOneChat,
  getAllChatsByStatus,
  getGroupDetails,
  deleteChatById,
  blockChat,
  getFollowerForChat
};