const mongoose = require("mongoose");
 
const privacyAndPolicySchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    content: {
      type: String,
    },
  },
  { timestamps: true }
);
 
const privacyAndPolicyModel = mongoose.model(
  "privacyAndPolicy",
  privacyAndPolicySchema
);
 
module.exports = privacyAndPolicyModel;