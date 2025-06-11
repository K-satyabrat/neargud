const mongoose = require("mongoose");
 
const aboutUsSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    content: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
  },
  { timestamps: true }
);
 
const aboutUsModel = mongoose.model("aboutUs", aboutUsSchema);
 
module.exports = aboutUsModel;