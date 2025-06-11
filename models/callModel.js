const { default: mongoose } = require("mongoose");
const callSchema = new mongoose.Schema(
    {
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      chatId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Chat",
        required: true,
      },
      participants: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      callType: {
        type: String,
        enum: ["audio", "video"],
        required: true,
      },
      callStatus: {
        type: Map,
        of: String, // Status for each participant (e.g., { "userId1": "ongoing", "userId2": "incoming" })
        default: {},
      },
      startedAt: {
        type: Date,
        default: Date.now,
      },
      endedAt: {
        type: Date,
      },
      isGroupCall: {
        type: Boolean,
        default: false,
      },
      videoStatus: {
        type: Map,
        of: Boolean, // Video ON/OFF for each participant (e.g., { "userId1": true, "userId2": false })
        default: {},
      },
      audioStatus: {
        type: Map,
        of: Boolean, // Audio ON/OFF for each participant (e.g., { "userId1": true, "userId2": true })
        default: {},
      },
    },
    { timestamps: true }
  );
  


const CallModel = mongoose.model('CallModel',callSchema)

module.exports= CallModel