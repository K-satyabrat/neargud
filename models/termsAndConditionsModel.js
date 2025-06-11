const mongoose = require("mongoose");
 
const termsAndConditionsSchema = new mongoose.Schema(
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
 
const termsAndConditionsModel = mongoose.model(
  "termsAndConditions",
  termsAndConditionsSchema
);
 
module.exports = termsAndConditionsModel;