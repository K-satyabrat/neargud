 
const bcrypt=  require("bcryptjs");
const Admin = require("../models/adminModel");
 
 
const  createJWT  = require("../utils/createJWT");
const { default: mongoose } = require("mongoose");
const User = require("../models/userModel");
const cloudinary = require("cloudinary").v2;
const ShopDetails = require("../models/shopModel");
const SubscriptionPlan = require("../models/subscriptionModel");
const getCoordinatesFromAddress = require("../utils/getLocationCoordinate");
const Follower = require("../models/follewerModel");
const Chat = require("../models/chatModel");
const NewPost = require("../models/postModel");
const ShopReview = require("../models/shopReviewModel");
const Reels = require("../models/reelModel");
const { emitMemberRemoved, emitChatDelete, emitMessageDelete } = require("../utils/socketHandler");
const NewMessage = require("../models/messageModel");
const Favourite = require("../models/faouriteCartModel");
 
 
  const registerAdmin = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone } = req.body;
 let image = null
    if(req.files){
      image = req.files.image
    }
    
    // Validate required fields
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: "First and last name must be at least 2 characters long.",
      });
    }
    if (!password) {
      return res.status(400).json({
        success: false,
        message: "password are required",
      });
    }
 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format." });
    }
 
    const phoneRegex = /^[0-9]{10}$/;
    if (!phone || !phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits.",
      });
    }
 
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: "Admin already exists with this email.",
      });
    }
 
    // Handle avatar upload
    if (!image) {
      return res.status(400).json({
        success: false,
        message: "Avatar is required.",
      });
    }
    
    updatedPassword = await bcrypt.hash(password, 12);
    
    
     
    // Create Admin in DB
    const admin = await Admin.create({
      firstName,
      lastName,
      email,
      password:updatedPassword,
      phone,
      url: image[0].path,
    });
 
    // Generate JWT Token
    const token = createJWT(admin._id);
 
    // Remove password from response
    admin.password = undefined;
 
    res.status(201).json({
      success: true,
      message: "Admin registered successfully",
      token,
      data: { admin },
    });
  } catch (error) {
    console.error("Error in registerAdmin:", error);
    res
      .status(500)
      .json({ success: false, message: "Error registering admin" });
  }
};
 
// login
const loginAdmin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are required.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    console.log("email:", email);

    const admin = await Admin.findOne({ email }).select("+password");
    console.log("admin:", admin);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    console.log("isPassValid:", isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = createJWT(admin._id);

    // Remove password before sending response
    admin.password = undefined;

    // Send secure HTTP-only cookie with token
    res
      .cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      })
      .status(200)
      .json({
        success: true,
        message: "Login successful",
        token,
        data: { admin },
      });
  } catch (error) {
    console.error("Error in loginAdmin:", error);
    res.status(500).json({ success: false, message: "Error logging in admin" });
  }
};


const logoutAdmin = async (req, res) => {
  console.log('cookie',req.cookies)
  res
    .cookie("token", "", {
      httpOnly: true,
      expires: new Date(0),
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    })
    .status(200)
    .json({
      status: "success",
      message: "Logged out successfully",
    });
}
// update by id
// update by id
 const updateAdmin = async (req, res) => {
  try {
    const {id} = req.params;
    const { firstName, lastName, email, password, phone} = req.body
    let image = null
    if(req.files){
      

      image = req.files.image
    }


    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid  Id format.",
      });
    }
       // Ensure Admin ID is provided
       if (!id) {
        return res.status(400).json({ success: false, message: "Admin ID is required." });
      }
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({ success: false, message: "Admin not found." });
    }


    if (firstName) admin.firstName = firstName;
    if (lastName) admin.lastName = lastName;
    if (email) admin.email = email;
    if (phone) admin.phone = phone;
    if (image) {
      // Delete the existing image from Cloudinary
      const existingImage = admin.url;
      await cloudinary.uploader.destroy(existingImage.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/")); // Extract public ID from the URL
      admin.url = image[0].path;
    }

    if(password){
      admin.password=  await bcrypt.hash(password, 12);
    }
  
 
    // Email validation
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: "Invalid email format." });
      }
      const checkEmail = await Admin.findOne({email})
      if(checkEmail){
        return res.status(400).json({
          message:"Admin already exist with this email",
          success:false
        })
      }
    }

    // Phone validation
    if (phone) {
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ success: false, message: "Phone number must be exactly 10 digits." });
      }
      const checkPhone = await Admin.findOne({phone})
      if(checkPhone){
        return res.status(400).json({
          message:"Admin already exist with this phone number",
          success:false
        })
      }
    }
 
    // Update admin document
     await admin.save();
    if (!admin) {
      return res.status(500).json({ success: false, message: "Failed to update admin." });
    }
 
    // Remove password from response
    admin.password = undefined;
 
    res.status(200).json({
      success: true,
      message: "Admin updated successfully",
      data: admin,
    });
  } catch (error) {
    console.log("Error updating admin:", error.message);
    res.status(500).json({ success: false, message: "Error updating admin" });
  }
};

const getUsers = async (req, res) => {
  try {
    const { limit = 10, page = 1 } = req.query;
    const currentPage = parseInt(page);

    const totalRecords = await User.countDocuments();
    const totalPage = Math.ceil(totalRecords / parseInt(limit));

    const users = await User.find({accountType:'customer'}, "-password")
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));
    return res.status(200).json({
      success: true,
      users,
      currentPage,
      totalRecords,
      totalPage,
      hasNextPage: currentPage < totalPage,
      hasPrevPage: currentPage > 1,
      page: parseInt(page),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message ,sucess:false });
  }
};

const getUserById = async (req, res) => {
 
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Id format.",
      });
    }
    // Find the user by ID
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }
    const getUser = await User.findById(id, "-password");
    return res.status(200).json({ success: true, getUser });
  } catch (error) {
    return res.status(500).json({ error: error.message ,success:false});
  }
};

const deleteUserById = async (req, res) => {
  try {
    const userId = req.params.userId; 

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId format.",
      });
    }
    if (!userId) {
      return res.status(400).json({
        message: "userId required",
        success: false,
      });
    }

    // Check if user exists
    const user = await User.findById({_id:userId});
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // Delete the related Shop and Subscription data
   const deletedShop= await ShopDetails.findOneAndDelete({ shopkeeperId: userId });
   if(deletedShop){
    if(deletedShop.bannerImage){
      await cloudinary.uploader.destroy(deletedShop.bannerImage.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/")); // Extract public ID from the URL
    }
   }
    await SubscriptionPlan.findOneAndDelete({ userId: userId });
    await Follower.findOneAndDelete({userId:userId})
    await ShopReview.deleteMany({userId:userId})

    
 
    // Find all chats where the user is a participant
    const userChats = await Chat.find({ participants: userId });
 
    for (const chat of userChats) {
      
      chat.participants = chat.participants.filter(participant => participant.toString() !== userId);

      if(chat.isGroup){
 // If a group chat has fewer than 3 participants, convert it into a one-to-one chat
      if (chat.isGroup && chat.participants.length < 3) {
        chat.isGroup = false;
        chat.groupName = null;
        chat.groupImage = null;
      }

      if (chat.participants.length <= 1) {
      const deleteChat =  await Chat.findByIdAndDelete(chat._id);
      if(deleteChat){
        if(deleteChat.groupImage){
          await cloudinary.uploader.destroy(deleteChat.groupImage.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/")); // Extract public ID from the URL
        }
      }
    
      

      emitChatDelete(chat._id,deleteChat)
      continue;
      }
      await chat.save();
      }
      else{
        const deleteChat=await Chat.findByIdAndDelete(chat._id)
      
        emitChatDelete(chat._id,deleteChat)
        continue;
      }
     
 
      emitMemberRemoved(chat, { _id: userId, name: user.name });
    }
const deletedMessages =await NewMessage.deleteMany({ sender: userId });

  if(deletedMessages && deletedMessages.length>0){
    for (const message of deletedMessages) {
      if(message.attachment){
        await cloudinary.uploader.destroy(message.attachment.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/"));  // Extract public ID from the URL
      }
    }
    
  }
    // Delete the user
    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      message: "User and related data deleted successfully",
      success: true,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: `Internal server error: ${err.message}`,
      success: false,
    });
  }
};


const getAllAdmin = async (req, res) => {
  try {
    const admins = await Admin.find({}, "-password");
    if (!admins) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }
    return res.status(200).json({ success: true, admins });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getAdminById = async (req, res) => {
 
  try {
    // Find the admin by ID
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Id format.",
      });
    }
    const admin = await Admin.findById(id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }
    return res.status(200).json({ success: true,message: "admin details",admin });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

const createBusinessUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      category,
      businessName,
      address,
      subscriptionPlan,
      startDate,
      endDate,
    } = req.body;
 
    let imageUrl = null;
 
     
    // Validate required fields
    if (!name || !email || !phone || !category || !businessName ||!subscriptionPlan || !address) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }
 
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format.",
      });
    }
 
    // Phone validation
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone number must be exactly 10 digits.",
      });
    }
 
    // Check if user already exists by email
    const existingUserByEmail = await User.findOne({ email });
    if (email && existingUserByEmail) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email.",
      });
    }
 
    // Check if user already exists by phone
    const existingUserByPhone = await User.findOne({ userPhoneNumber:phone });
    if (existingUserByPhone) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this phone number.",
      });
    }
 
    // Handle image upload
    if (req.files && req.files.image) {
      imageUrl = req.files.image[0].path;
    }
 
    let locationData = await getCoordinatesFromAddress(address)
    if(!locationData){
      return res.status(400).json({
        message:'invalid address',
        success:false
      })
     }
    let location = null
    

    if(locationData){
      location={
        type: "Point",
        coordinates: [parseFloat(locationData.longitude), parseFloat(locationData.latitude)],
      }
    }
    // Create user in DB
    const user = await User.create({
      name,
      userPhoneNumber: phone,
      accountType: "business",
      email,
      image: imageUrl,
      address:address,
      location:location
    });
   
    // Create shop for the user
    const shop = await ShopDetails.create({
      shopkeeperId: user._id,
      shopName: businessName,
      category,
      contactNumber: phone,
      shopLocation: location,
      address:address
    });
 
    // Create subscription for user
    let subscription = null;
    if (subscriptionPlan != "free") {
      // Validate Subscription Plan
      const validPlans = ["basic", "advance", "pro"];
      if (!validPlans.includes(subscriptionPlan)) {
        return res.status(400).json({
          message: "Invalid subscription plan selected",
          success: false,
        });
      }
 
      // Subscription Features
      const validFeaturesBasic = [
        "Search Visibility: 1x",
        "Reviews",
        "Share Photo Video",
        "Video Visibility",
        "Suggested Business",
      ];
      const validFeaturesAdvance = [
        "Search Visibility: 3x",
        "Reviews",
        "Share Photo Video",
        "Video Visibility",
        "Suggested Business",
      ];
      const validFeaturesPro = [
        "searchVisibility",
        "reviews",
        "sharePhotoVideo",
        "videoVisibility",
        "suggestedBusiness",
        "guaranteedTopVisibility",
        "verifiedBadge",
        "bestInTheCityTag",
        "top10List",
      ];
 
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
 
      subscription = new SubscriptionPlan({
        userId: user._id,
        shopId: [shop._id],
        subscriptionPlan,
        subscriptionPlanPrice,
        features,
        startDate,
        endDate,
      });

      await subscription.save();
      
      // Update user's subscription status
      
      await user.save();

      
   
    await Follower.create({
      userId:user._id
   })
 
    }
 
    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: { user, subscription, shop },
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: `Internal server error: ${err.message}`,
      success: false,
    });
  }
};
 
const updateBusinessUser = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      category,
      businessName,
      address,
      subscriptionPlan,
      startDate,
      endDate,
    } = req.body;
    
const {userId} = req.params;

if (!mongoose.Types.ObjectId.isValid(userId)) {
  return res.status(400).json({
    success: false,
    message: "Invalid Id format.",
  });
}
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }
 
    // -- check whether user with email or phone already exists
    if (phone) {
      // Phone validation
      const phoneRegex = /^[0-9]{10}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({
          success: false,
          message: "Phone number must be exactly 10 digits.",
        });
      }
 
      // Check if user already exists by phone
      
    }
    if (email) {
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Invalid email format.",
        });
      }
      
     
    }


    const existingUserByEnail = await User.findOne({email
    });
    if (
      email &&
      existingUserByEnail &&
      existingUserByEnail.email != user.email
    ) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this email.",
      });
    }
 
    let imageUrl = null;
    // Handle image upload
    if (req.files && req.files.image) {
      // Delete the existing image from Cloudinary
      imageUrl = req.files.image[0].path;
    }
 
    // Update user details
    if (name) user.name = name;
    if (email) user.email = email;
    if (imageUrl) {
      // Delete the existing image from Cloudinary
      await cloudinary.uploader.destroy(user.image.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/"));  // Extract public ID from the URL
      user.image = imageUrl;
    }
 
    // Update shop details
    const shop = await ShopDetails.findOne({ shopkeeperId: userId });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found.",
      });
    }
 
    const existingShopByPhone = await ShopDetails.findOne({
      contactNumber: phone,
    });
    if (
      existingShopByPhone &&
      existingShopByPhone.contactNumber != shop.contactNumber
    ) {
      return res.status(409).json({
        success: false,
        message: "User already exists with this phone number.",
      });
    }
    if (businessName) shop.shopName = businessName;
    if (category) shop.category = category;
    if (phone) shop.contactNumber = phone;
    if (address){
      const locationData = await getCoordinatesFromAddress(address)
      if(!locationData){
  return res.status(400).json({
    message:'invalid address',
    success:false
  })
 }
      shop.shopLocation = {
        type: "Point",
        coordinates: [parseFloat(locationData.longitude), parseFloat(locationData.latitude)],
      };
      shop.address=address
    }
 
    // Update subscription details
    let subscription = await SubscriptionPlan.findOne({ userId: userId });
    let updatedSubscription =null
    
    if (subscriptionPlan){
       
      if (subscriptionPlan !== "free") {
        // Validate Subscription Plan
       
        const validPlans = ["basic", "advance", "pro"];
        if (subscriptionPlan && !validPlans.includes(subscriptionPlan)) {
          return res.status(400).json({
            message: "Invalid subscription plan selected",
            success: false,
          });
        }
 
        // Subscription Features
        const validFeaturesBasic = [
          "Search Visibility: 1x",
          "Reviews",
          "Share Photo Video",
          "Video Visibility",
          "Suggested Business",
        ];
        const validFeaturesAdvance = [
          "Search Visibility: 3x",
          "Reviews",
          "Share Photo Video",
          "Video Visibility",
          "Suggested Business",
        ];
        const validFeaturesPro = [
          "searchVisibility",
          "reviews",
          "sharePhotoVideo",
          "videoVisibility",
          "suggestedBusiness",
          "guaranteedTopVisibility",
          "verifiedBadge",
          "bestInTheCityTag",
          "top10List",
        ];
 
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
        const isValidDate = (date) => {
          return date && !isNaN(new Date(date).getTime());
        };
        
        // Validate startDate and endDate before assigning
        if (startDate && !isValidDate(startDate)) {
          return res.status(400).json({
            success: false,
            message: "Invalid start date format. Use 'YYYY-MM-DDTHH:mm:ss.sssZ'.",
          });
        }
        
        if (endDate && !isValidDate(endDate)) {
          return res.status(400).json({
            success: false,
            message: "Invalid end date format. Use 'YYYY-MM-DDTHH:mm:ss.sssZ'.",
          });
        }

        if(new Date(startDate)>=new Date(endDate)){
          return res.status(400).json({
            message:"endDate must be grater than startData",
            success:false,
          })
        }
        
        if (!subscription) {
    
          subscription = new SubscriptionPlan({
            userId: user._id,
            shopId: [shop._id],
            subscriptionPlan,
            subscriptionPlanPrice,
            features,
            startDate,
            endDate,
          });
        } else {
          
         
         if(subscriptionPlan) subscription.subscriptionPlan = subscriptionPlan;
        if(subscriptionPlanPrice) subscription.subscriptionPlanPrice = subscriptionPlanPrice;
         if(features) subscription.features = features;
         if(startDate) subscription.startDate = new Date(startDate);
         if(endDate) subscription.endDate = new Date(endDate);
        }
 
        // Save the subscription to the database
       updatedSubscription= await subscription.save();
 
        // Update user's subscription status
        
      } else {
        
        // -- handle subscription if it is changed from paid to free
        if (subscription)
          await SubscriptionPlan.findByIdAndDelete(subscription._id);
        updatedSubscription=null
      }
    }
 
    // Save the updated user and shop details
    await user.save();
    await shop.save();

    const businessUserDetails = {
      name:user.name,
      businessName:shop.shopName,
      category:shop.category,
      phone:shop.contactNumber,
      email:user.email,
      image:user.image?user.image:null,
      address:shop.address?shop.address:null,
      subscriptionDetails:updatedSubscription?{
        subscriptionPlan: updatedSubscription.subscriptionPlan,
        subscriptionPlanPrice: updatedSubscription.subscriptionPlanPrice,
        features: updatedSubscription.features,
        startDate: updatedSubscription.startDate,
        endDate: updatedSubscription.endDate,
      }:null
 
 
    };
 
    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: businessUserDetails,
    });
 
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: `Internal server error: ${err.message}`,
      success: false,
    });
  }
};

const getAllBusinessUser = async (req, res) => {
  try {

    const { limit = 10, page = 1 } = req.query;
    const currentPage = parseInt(page);

    const totalRecords = await User.find({ accountType: "business" }).countDocuments();
    const totalPage = Math.ceil(totalRecords / parseInt(limit));

    const allBusinessUser = await User.find({ accountType: "business" })
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));;

    const currentDate = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(currentDate.getDate() + 7);

    const updatedAllBusinessUser = await Promise.all(
      allBusinessUser.map(async (user) => {
        const subscription = await SubscriptionPlan.findOne({ userId: user._id });

        let subscriptionStatus = "Not Purchased";  
        if (subscription) {
          const endDate = new Date(subscription.endDate);  

          if (endDate <= currentDate) {
            subscriptionStatus = "Inactive";
          } else if (endDate <= sevenDaysFromNow) {
            subscriptionStatus = "Expiring soon";
          } else {
            subscriptionStatus = "Active";
          }
        }

        return {
          ...user.toObject(),  
          subscriptionStatus,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: updatedAllBusinessUser,
      totalRecords,
      totalPage,
      hasNextPage: currentPage < totalPage,
      hasPrevPage: currentPage > 1,
      page: parseInt(page),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: `Internal server error: ${error.message}`,
      success: false,
    });
  }
};

const getBusinessUserById = async (req,res)=>{
  try {
    const { userId } = req.params;
 
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid userId format.",
      });
    }
    // Check if userId is provided
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }
 
    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }
 
    // Find the shop details associated with the user
    const shop = await ShopDetails.findOne({ shopkeeperId: userId });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found.",
      });
    }
 
    // Find the subscription details associated with the user
    const subscription = await SubscriptionPlan.findOne({ userId: userId });
    // Combine user, shop, and subscription details into a single object
    const businessUserDetails = {
      name:user.name,
      businessName:shop.shopName,
      category:shop.category,
      phone:shop.contactNumber,
      location: shop.shopLocation,
      email:user.email,
      image:user.image?user.image:null,
      address:shop.address?shop.address:null,
      subscriptionDetails:subscription?{
        subscriptionPlan: subscription.subscriptionPlan,
        subscriptionPlanPrice: subscription.subscriptionPlanPrice,
        features: subscription.features,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
      }:null
 
 
    };
 
    res.status(200).json({
      success: true,
      message: "Business user details",
      data: businessUserDetails,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: `Internal server error: ${err.message}`,
      success: false,
    });
  }
}
 
const deleteBusinessUserById = async (req,res)=>{
  try{
  const {userId} = req.params


  if(!userId){
    return res.status(400).json({
      message:"userId required",
      success:false
    })
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid userId format.",
    });
  }

  const subscription = await SubscriptionPlan.findOne({userId})

  if(subscription){
    await SubscriptionPlan.findOneAndDelete({userId})
  }
  const shop = await ShopDetails.findOne({shopkeeperId:userId})

  if(shop){
    const posts = await NewPost({shopId:shop._id})

    if(posts && posts.length>0){
    const deletedPosts=  await NewPost.deleteMany({shopId:shop._id})
      for (const post of deletedPosts) {
        if(post.image && post.image.length>0){
          for (const image of post.image) {
            await cloudinary.uploader.destroy(image.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/")); // Extract public ID from the URL
          }
        }
        // remove post for favorites
        await Favourite.updateMany(
          { likedProducts: post._id },
          { $pull: { likedProducts: post._id } }
        );
      }
    }

    const reels = await Reels.find({shopId:shop._id})
    if(reels && reels.length>0){
     const deletedReels= await Reels.deleteMany({shopId:shop._id})
      for (const reel of deletedReels) {
        if(reel.videoURL){
          await cloudinary.uploader.destroy(reel.videoURL.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/")); // Extract public ID from the URL
        }
        //delete reel for favorites
        await Favourite.updateMany(
          { likedVideos: reel._id },
          { $pull: { likedVideos: reel._id } }
        );
    }
    }
    const shopReviews = await ShopReview.find({shopId:shop._id})

    if(shopReviews && shopReviews.length>0){
      await ShopReview.deleteMany({shopId:shop._id})
    }
    const deletedShop = await ShopDetails.findOneAndDelete({shopkeeperId:userId})
    if(deletedShop){
      if(deletedShop.bannerImage){
        await cloudinary.uploader.destroy(deletedShop.bannerImage.split('/').pop().split('.')[0]); // Extract public ID from the URL
      }
      // delete shop form favorites
      await Favourite.updateMany(
        { likedShops: deletedShop._id },
        { $pull: { likedShops: deletedShop._id } }
      );
    }
  }

  const isFollower = await Follower.findOne({userId:userId})

   if(isFollower){
    await Follower.findOneAndDelete({
      userId:userId
    })
   }

   // Find all chats where the user is a participant
   const userChats = await Chat.find({ participants: userId });
 
   for (const chat of userChats) {
     // **GROUP CHAT HANDLING**
     if (chat.isGroup) {
       if (chat.admin?.toString() === userId) {
         const otherBusinessUsers = await User.find({
           _id: { $in: chat.participants, $ne: userId },
           accountType: "business"
         });

         if (otherBusinessUsers.length > 0) {
           chat.admin = otherBusinessUsers[0]._id; // Assign new admin
         } else {
          const deleteChat= await Chat.findByIdAndDelete(chat._id); // No business users left, delete chat
           emitChatDelete(chat._id,deleteChat)
           continue; // Skip further processing for this chat
         }
       }
       chat.participants = chat.participants.filter(id => id.toString() !== userId);
       if (chat.isGroup && chat.participants.length < 3) {
        chat.isGroup = false;
        chat.groupName = null;
        chat.groupImage = null;
      }
       await chat.save();

       // **NEW: If only ONE participant is left, DELETE the chat**
       if (chat.participants.length <= 1) {
         const deleteChat=await Chat.findByIdAndDelete(chat._id);
         emitChatDelete(chat._id,deleteChat)
         continue;
       }
       emitMemberRemoved(chat, userId);
     } else {
        const deleteChat = await Chat.findByIdAndDelete(chat._id);
        emitChatDelete(chat._id,deleteChat)
     }
   }
   // Delete user's messages
  const deletedMessages= await NewMessage.deleteMany({ sender: userId });
  if(deletedMessages && deletedMessages.length>0){
    for (const message of deletedMessages) {
      if(message.attachment){
        await cloudinary.uploader.destroy(message.attachment.split('/').pop().split('.')[0]);
      }
     
    }
  }
  const deletedReels =  await Reels.deleteMany({user:userId})
  if(deletedReels && deletedReels.length>0){
    for (const reel of deletedReels) {
      if(reel.videoURL){
        await cloudinary.uploader.destroy(reel.videoURL.split('/').pop().split('.')[0]); // Extract public ID from the URL
      }
    }
  }
  const user = await User.findByIdAndDelete(userId)

  if(!user){
    return res.status(400).json({
      message:"failed to delete business user",
      success:false
    })
  }

  return res.status(200).json({
    message:"business user deleted successfull",
    success:true,
  })

  }
  catch(error){
    console.log(err);
    return res.status(500).json({
      message: `Internal server error: ${err.message}`,
      success: false,
  })
}
}


 

module.exports={registerAdmin,loginAdmin,updateAdmin,
                getUsers,getUserById,deleteUserById,
                getAllAdmin,getAdminById,logoutAdmin,
                createBusinessUser,updateBusinessUser,
                getAllBusinessUser,getBusinessUserById,
                deleteBusinessUserById, }