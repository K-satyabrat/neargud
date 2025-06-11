const mongoose = require("mongoose");
 
const notificationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  sendCategory: { type: String, enum: ["customers", "businesses"], required: true },
  description: { type: String, required: true },
  imageUrl: { type: String },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
},{timestamps:true});
 
const Notification =mongoose.model("Notification", notificationSchema);
module.exports = Notification 