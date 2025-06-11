const CallModel = require("../models/callModel");
const Chat = require("../models/chatModel");

const connectedUsers = new Map();
let ioInstance;

// Helper function to broadcast events to participants
const broadcastToParticipants = (chat, event, data, excludeUserId = null) => {
  console.log("event", event);
  console.log("data", data);
  chat.participants.forEach((user) => {
    if (user._id.toString() !== excludeUserId) {
      const receiverInfo = connectedUsers.get(user._id.toString());
      if (receiverInfo) {
        ioInstance.to(receiverInfo.socketId).emit(event, data);
      }
    }
  });
};

const socketHandler = (io) => {
  ioInstance = io;

  io.on("connection", (socket) => {
    // Handle user identification
    socket.on("identify", ({ userId, category }) => {
      if(!userId) return;
      connectedUsers.set(userId, { socketId: socket.id, category });
      console.log(`User ${userId} connected with socket ID ${socket.id}`);
    });

    socket.on("joinChat", ({ chatId }) => {
      socket.join(chatId);
      console.log(`User ${socket.id} joined chat room: ${chatId}`);
    });

    // Start Call (One-to-One or Group)
    socket.on("start-call", async ({ senderId, chatId, callType }) => {
      try {
        const chat = await Chat.findById(chatId).populate("participants");
        if (!chat) throw new Error("Chat not found");

        let newCall;
        const callStatus = {};
        const videoStatus = {};
        const audioStatus = {};

        if (!chat.isGroup) {
          // One-to-One Call
          const receiverId = chat.participants.find((id) => id.toString() !== senderId);
          callStatus[senderId] = "ongoing";
          callStatus[receiverId] = "incoming";
          videoStatus[senderId.toString()] = true;
          videoStatus[receiverId.toString()] = true;
          audioStatus[senderId.toString()] = true;
          audioStatus[receiverId.toString()] = true;

          newCall = await CallModel.create({
            senderId,
            receiverId,
            chatId,
            videoStatus,
            audioStatus,
            participants: [senderId, receiverId],
            callType,
            callStatus,
            isGroupCall: false,
          });

          const user = connectedUsers.get(receiverId);
          if (user?.socketId) {
            io.to(user.socketId).emit("incoming-call", {
              newCall,
              from: senderId,
              offer: socket.handshake.query.offer, // Include the offer in the event
            });
          }
        } else {
          // Group Call
          chat.participants.forEach((user) => {
            callStatus[user._id.toString()] = user._id.toString() === senderId ? "ongoing" : "incoming";
            videoStatus[user._id.toString()] = true;
            audioStatus[user._id.toString()] = true;
          });

          newCall = await CallModel.create({
            senderId,
            chatId,
            participants: chat.participants.map((user) => user._id),
            callType,
            callStatus,
            audioStatus,
            videoStatus,
            isGroupCall: true,
          });

          broadcastToParticipants(chat, "incoming-call", {
            newCall,
            from: senderId,
            offer: socket.handshake.query.offer, // Include the offer in the event
          }, senderId);
        }

        chat.currentCall = newCall._id;
        await chat.save();

        socket.join(newCall._id.toString());
      } catch (error) {
        console.error("Error in start-call:", error.message);
      }
    });

    // WebRTC Signaling (Offer, Answer, ICE Candidates)
    socket.on("send-offer", async ({ offer, chatId, from }) => {
      const chat = await Chat.findById(chatId).populate("participants");
      if (!chat) return;

      broadcastToParticipants(chat, "receive-offer", { offer, from }, from);
    });

    socket.on("send-answer", async ({ answer, chatId, from }) => {
      const chat = await Chat.findById(chatId).populate("participants");
      if (!chat) return;

      broadcastToParticipants(chat, "receive-answer", { answer, from }, from);
    });

    socket.on("send-ice-candidate", async ({ candidate, chatId, from }) => {
      const chat = await Chat.findById(chatId)
      if (!chat) return;

      broadcastToParticipants(chat, "receive-ice-candidate", { candidate, from }, from);
    });

    // Handle Disconnection
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);

      const userEntry = [...connectedUsers.entries()].find(([_, user]) => user.socketId === socket.id);
      if (userEntry) {
        const [userId] = userEntry;
        if (connectedUsers.get(userId)?.socketId === socket.id) {
          connectedUsers.delete(userId);
          console.log(`User ${userId} removed from connectedUsers`);
        }
      }
    });
  });
};
 

 
const sendNotification = (notification, sendCategory) => {
  connectedUsers.forEach((userInfo, userId) => {
    if (userInfo.category === sendCategory) {
      ioInstance.to(userInfo.socketId).emit("newNotification", notification);
    }
  });
};
const emitMemberAdded = async (chat, newMember) => {
  try {
    ioInstance.to(chat._id.toString()).emit("memberAdded", {
      chatId: chat._id,
      newMember,
    });
  } catch (error) {
    console.error(`Failed to emit memberAdded event for chat ${chat._id}:`, error);
  }
};

const emitMemberRemoved = async (chat, oldMember) => {
  try {
    ioInstance.to(chat._id.toString()).emit("memberRemoved", {
      chatId: chat._id,
      oldMember,
    });
  } catch (error) {
    console.error(`Failed to emit memberRemoved event for chat ${chat._id}:`, error);
  }
};

const emitChatDetailsUpdated = async (chat, updatedDetails) => {
  try {
    ioInstance.to(chat._id.toString()).emit("chatDetailsUpdated", {
      chatId: chat._id,
      updatedDetails,
    });
  } catch (error) {
    console.error(`Failed to emit chatDetailsUpdated event for chat ${chat._id}:`, error);
  }
};

const emitMemberLeft = async (chat, oldMember) => {
  try {
    ioInstance.to(chat._id.toString()).emit("memberLeft", {
      chatId: chat._id,
      oldMember,
    });
  } catch (error) {
    console.error(`Failed to emit memberLeft event for chat ${chat._id}:`, error);
  }
};

const emitMessageSend = async (chat, message) => {
  try {
    ioInstance.to(chat._id.toString()).emit("messageSend", {
      chatId: chat._id,
      message,
    });
  } catch (error) {
    console.error(`Failed to emit messageSend event for chat ${chat._id}:`, error);
  }
};

const emitMessageDelete = async (chat, message) => {
  try {
    ioInstance.to(chat._id.toString()).emit("messageDelete", {
      chatId: chat._id,
      message,
    });
  } catch (error) {
    console.error(`Failed to emit messageDelete event for chat ${chat._id}:`, error);
  }
};

const emitMessageEdit = async (chat, message) => {
  try {
    ioInstance.to(chat._id.toString()).emit("messageEdit", {
      chatId: chat._id,
      message,
    });
  } catch (error) {
    console.error(`Failed to emit messageEdit event for chat ${chat._id}:`, error);
  }
};

const emitNewChat = async (chat) => {
  try {
    // Ensure all members join the chat room
    chat.participants.forEach(userId => {
      const userInfo = connectedUsers.get(userId.toString());
      if (userInfo) {
        ioInstance.sockets.sockets.get(userInfo.socketId).join(chat._id.toString());
      }
    });
    // Emit the newChat event to the chat room
    ioInstance.to(chat._id.toString()).emit("newChat", {
      chatId: chat._id,
      chatDetails: chat,
    });
  } catch (error) {
    console.error(`Failed to emit newChat event for chat ${chat._id}:`, error);
  }
}; 

const emitChatDelete = async (chatId,chat) => {
  try {
    ioInstance.to(chatId.toString()).emit("chatDeleted", { chatId ,chat});
  } catch (error) {
    console.error(`Failed to emit chatDeleted event for chat ${chatId}:`, error);
  }
};

 
module.exports = {
  socketHandler,
  sendNotification,
  emitMemberAdded,
  emitMemberRemoved,
  emitChatDetailsUpdated,
  emitMemberLeft,
  emitMessageSend,
  emitMessageDelete,
  emitMessageEdit,
  emitNewChat,
  emitChatDelete,
};