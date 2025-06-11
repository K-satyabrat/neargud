const { default: mongoose } = require("mongoose");
const ShopDetails = require("../models/shopModel");
const SubscriptionPlan = require("../models/subscriptionModel");
const User = require("../models/userModel");
const Payment = require("../models/paymentModel");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const { validatePaymentVerification } = require("razorpay/dist/utils/razorpay-utils");
require("dotenv").config();

const getOrderId = async (req, res) => {
  try {
    const { userId, subscriptionPlan, subscriptionPlanType } = req.body;

    if (!userId || !subscriptionPlan || !subscriptionPlanType) {
      return res.status(400).json({
        message: "userId, subscriptionPlan, and subscriptionPlanType are required",
        success: false,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId format.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    if(user.accountType!== "business") {
      return res.status(400).json({
        message: "User must be a business to subscribe",
        success: false,
      });
    }

    const validPlans = ["basic", "advance", "pro"];
    if (!validPlans.includes(subscriptionPlan)) {
      return res.status(400).json({
        message: "Invalid subscription plan selected",
        success: false,
      });
    }

    const validFeaturesBasic = ["Search Visibility: 1x", "Reviews", "Share Photo Video", "Video Visibility", "Suggested Business"];
    const validFeaturesAdvance = ["Search Visibility: 3x", "Reviews", "Share Photo Video", "Video Visibility", "Suggested Business"];
    const validFeaturesPro = ["searchVisibility", "reviews", "sharePhotoVideo", "videoVisibility", "suggestedBusiness", "guaranteedTopVisibility", "verifiedBadge", "bestInTheCityTag", "top10List"];

    const shop = await ShopDetails.findOne({ shopkeeperId: userId });

    if (!shop) {
      return res.status(404).json({
        message: "Shop not found for this user",
        success: false,
      });
    }
    const shopId =  shop._id 

    let features = [];
    let subscriptionPlanPrice = 0;
    if (subscriptionPlan === "basic") {
      features = [...validFeaturesBasic];
      subscriptionPlanPrice = 799;
    } else if (subscriptionPlan === "advance") {
      features = [...validFeaturesAdvance];
      subscriptionPlanPrice = 1299;
    } else {
      features = [...validFeaturesPro];
      subscriptionPlanPrice = 1499;
    }

    if (subscriptionPlanType === "yearly") {
      subscriptionPlanPrice *= 12;
    }

    const receiptId = `${Date.now().toString()}&${Math.random()}`;
    console.log("keys", process.env.RAZORPAY_KEYID, process.env.RAZORPAY_SECRET)
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEYID,
      key_secret: process.env.RAZORPAY_SECRET,
    });
   
    const resp = await instance.orders.create({
      amount: subscriptionPlanPrice * 100, // Razorpay expects amount in paise
      currency: "INR",
      receipt: receiptId,
    });

    // only for test mode on postman payment_id and signature are required in production mode it will get from client side
    const payment_id = "pay_test_1234567890";
    const signature = crypto
  .createHmac("sha256",  process.env.RAZORPAY_SECRET)
  .update(`${resp.id}|${payment_id}`)
  .digest("hex");

  
  

    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + (subscriptionPlanType === "yearly" ? 12 : 1));

    const payment = new Payment({
      receiptId,
      userId,
      shopId: shopId,
      subscriptionPlan,
      subscriptionPlanPrice,
      subscriptionPlanType,
      features,
      startDate: new Date(),
      endDate,
      razorPayResponse: resp,
    });

    await payment.save();

    return res.status(201).json({
      message: "OrderId created successfully!",
      success: true,
      resp:{...resp, payment_id, signature,amount: subscriptionPlanPrice,amount_due: subscriptionPlanPrice},
    });
  } catch (error) {
    console.error("Subscription Error:", error);
    return res.status(500).json({
      message: `Internal server error ${error.message}`,
      success: false,
    });
  }
};

const validateSuccess = async (req, res) => {
  try {
    const { order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        message: "Send required fields",
        success: false,
      });
    }

    const payment = await Payment.findOne({ orderId: order_id });
    if (!payment) {
      return res.status(404).json({
        message: "Payment details not found, invalid orderId!",
        success: false,
      });
    }

    const signatureStatus = validatePaymentVerification(
      { order_id, payment_id: razorpay_payment_id },
      razorpay_signature,
      process.env.RAZORPAY_SECRET
    );

    if (signatureStatus) {

    if(payment.status === "success"){
      return res.status(200).json({
        message: "Payment already successful",
        success: true,
      });
    } 
    let subscriptionPlan = await SubscriptionPlan.findOne({userId: payment.userId });

    if(subscriptionPlan){
      const today = new Date();
      if(today > subscriptionPlan.endDate){

        if(subscriptionPlan.nextSubscriptions.length > 0){
          const newSubscription = {}
          newSubscription.subscriptionPlan = payment.subscriptionPlan;
          newSubscription.subscriptionPlanPrice = payment.subscriptionPlanPrice;
          newSubscription.planType = payment.subscriptionPlanType;
          newSubscription.features = payment.features;
          newSubscription.startDate = subscriptionPlan.nextSubscriptions.length>0?
          subscriptionPlan.nextSubscriptions[subscriptionPlan.nextSubscriptions.length-1].endDate: new Date();
          newSubscription.endDate = new Date(newSubscription.startDate);
          newSubscription.endDate.setMonth(newSubscription.endDate.getMonth() + (payment.subscriptionPlanType === "yearly" ? 12 : 1));
          subscriptionPlan.nextSubscriptions.push(newSubscription);
          await subscriptionPlan.save();

        }
        else{
          subscriptionPlan.endDate = payment.endDate; 
          subscriptionPlan.startDate = new Date();
          subscriptionPlan.features = payment.features;
          subscriptionPlan.planType = payment.subscriptionPlanType;
          subscriptionPlan.subscriptionPlanPrice= payment.subscriptionPlanPrice;
          subscriptionPlan.subscriptionPlan= payment.subscriptionPlan;
          await subscriptionPlan.save();
        }
      

      }
      else{
          const newSubscription = {}
          newSubscription.subscriptionPlan = payment.subscriptionPlan;
          newSubscription.subscriptionPlanPrice = payment.subscriptionPlanPrice;
          newSubscription.planType = payment.subscriptionPlanType;
          newSubscription.features = payment.features;
          newSubscription.startDate = subscriptionPlan.nextSubscriptions.length>0?
          subscriptionPlan.nextSubscriptions[subscriptionPlan.nextSubscriptions.length-1].endDate:subscriptionPlan.endDate;
          newSubscription.endDate = new Date(newSubscription.startDate);
          newSubscription.endDate.setMonth(newSubscription.endDate.getMonth() + (payment.subscriptionPlanType === "yearly" ? 12 : 1));
          subscriptionPlan.nextSubscriptions.push(newSubscription);
          await subscriptionPlan.save();
      }
    }
    else{
       subscriptionPlan = new SubscriptionPlan({
        userId: payment.userId,
        shopId: payment.shopId,
        subscriptionPlan: payment.subscriptionPlan,
        subscriptionPlanPrice: payment.subscriptionPlanPrice,
        planType: payment.subscriptionPlanType,
        features: payment.features,
        startDate: payment.startDate,
        endDate: payment.endDate,
        nextSubscriptions: [],
      });
      await subscriptionPlan.save();

    }

     
      payment.status = "success";
      await payment.save();

      return res.status(200).json({
        message: "Payment successful!",
        success: true,
        subscriptionPlan,
      });
    }

    payment.status = "failed";
    await payment.save();

    return res.status(400).json({
      message: "Invalid payment.",
      success: false,
    });
  } catch (error) {
    console.error("Subscription Error:", error);
    return res.status(500).json({
      message: `Internal server error ${error.message}`,
      success: false,
    });
  }
};

const getSubscription = async(req,res)=>{
  try{
    const {userId} = req.params;
    if(!userId){
      return res.status(400).json({
        message:'userId is required',
        success:false
      })
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId format.",
      });
    } 
    
    const userSubscription = await SubscriptionPlan.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
      $project: {
        _id: 0,
        userId: 1,
        planType: "$subscriptionPlan",
        amount: "$subscriptionPlanPrice",
        duration: "$planType",
        status: { $cond: [{ $gte: ["$endDate", new Date()] }, "active", "expired"] },
        renewalDate: {
        $dateToString: { format: "%d-%b-%Y", date: "$endDate" }
        }
      }
      }
    ]);
    if(!userSubscription){
      return res.status(404).json({
        message:'Subscription not found',
        success:false
      })
    }
    
    return res.status(200).json({
      message:'Subscription fetched successfully',
      success:true,
      data:userSubscription?userSubscription[0]:{}
    })
  }
  catch(err){
    console.log(err);
    return res.status(500).json({
      message:`Internal server error ${err.message}`,
      success:false
    })
  }
}
module.exports = { getOrderId, validateSuccess,getSubscription };
