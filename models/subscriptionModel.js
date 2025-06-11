const mongoose = require("mongoose");

const nextSubscriptionSchema = new mongoose.Schema({
  subscriptionPlan: {
    type: String,
    enum: ["basic", "advance", "pro"],
  },
  planType: {
    type: String,
    enum: ["monthly", "yearly"],
    default: "monthly",
  },
  subscriptionPlanPrice: Number,
  features: [String],
  startDate: Date,
  endDate: Date,
});

const subscriptionPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ShopDetails",
  },
  subscriptionPlan: {
    type: String,
    enum: ["basic", "advance", "pro"],
    default: "basic",
  },
  planType: {
    type: String,
    enum: ["monthly", "yearly"],
    default: "monthly",
  },
  subscriptionPlanPrice: Number,
  features: [String],
  startDate: {
    type: Date,
    default: Date.now,
  },
  endDate: {
    type: Date,
    default: () => new Date(new Date().setMonth(new Date().getMonth() + 1)),
  },
  nextSubscriptions: [nextSubscriptionSchema], // ← Queue of upcoming subscriptions
});

module.exports = mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
