const mongoose = require('mongoose');
 
const NewMessageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chats", 
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: function () {
        return !this.attachment;
      },
    },
    attachment: {
      type: String,
      required: function () {
        return !this.content;
      },
    },
    readBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        readAt: { type: Date, default: Date.now }, 
      },
    ],
    status: {
      type: String,
      enum: ["active", "deleted","edited"],
      default: "active",
    },
  },
  { timestamps: true }
);
 
const NewMessage = mongoose.model("Messages", NewMessageSchema);
module.exports = NewMessage;