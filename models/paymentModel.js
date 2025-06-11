const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  shopId: {
     type: mongoose.Schema.Types.ObjectId, ref: "ShopDetails" 
    } ,
  subscriptionPlan: {
    type: String,
    enum: ["basic", "advance", "pro"],
    default: "basic",
  },
  subscriptionPlanType: {
    type: String,
    enum: ["monthly", "yearly"],
    required: true,
  },
  subscriptionPlanPrice: {
    type: Number,
    required: true,
  },
  features: {
    type: [String],
    required: true,
  },
  startDate: {
    type: Date,
    default: Date.now,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
    default: () => {
      const now = new Date();
      return new Date(now.setMonth(now.getMonth() + 1));
    },
  },
  status: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "pending",
  },
  currency: {
    type: String,
    default: "INR",
  },
  receiptId: {
    type: String,
    required: true,
  },
  razorPayResponse: {
    type: Object,
    default: {},
  },
  orderId: {
    type: String,
    required: true,
  },
}, {
  timestamps: true, // optional: adds createdAt and updatedAt
});

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
