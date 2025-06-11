const  mongoose = require("mongoose");
 
const campaignSchema = new mongoose.Schema(
  {
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    carousel: [
      {
        link: {
          type: String,
          required: true,
        },
        image: {
          type: String,
          // required: true,
        },
      },
    ],
  },
  { timestamps: true }
);
 
const Campaign = mongoose.model("Campaign", campaignSchema);
module.exports=Campaign