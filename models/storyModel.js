const mongoose = require("mongoose");
 
const storySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", 
 
  },
  mediaUrl: {
    type: String,
    
  },
  mediaType: {
    type: String,
    enum: ["image", "video"], 
    required: true,
  },
  caption: {
    type: String,
    default: "", 
  },
  viewers: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", 
      },
      viewedAt: {
        type: Date,
        default: Date.now, 
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: "24h", 
  },
});
 
// Create the Story model
const Story = mongoose.model("Story", storySchema);
 
module.exports = Story;