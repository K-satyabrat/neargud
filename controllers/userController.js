 
const { default: mongoose } = require("mongoose");
const TempUser = require("../models/tempUserModel");
const User = require("../models/userModel");
const cloudinary = require("cloudinary").v2;
const nodemailer = require("nodemailer");
const subscriptionModel = require("../models/subscriptionModel");
require('dotenv').config();


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: "akashtikhat50@gmail.com", pass: "miue czgi imkc scrs" },
});
 
 

const userLogin = async(req,res)=>{
    try{
    const {userPhoneNumber,email} = req.body;
    if(!userPhoneNumber){
        return res.status(400).json({
            message: 'User number is required',
            success:false
        })
    }
    if (!/^\d+$/.test(userPhoneNumber)) {
        return res.status(400).json({ message: 'Invalid phone number. Only digits allowed.',success:false });
    }

    
    if (userPhoneNumber.length !== 10) {
        return res.status(400).json({ message: 'Invalid phone number. Must be 10 digits long.',success:false });
    }
     
    let otp = Math.floor(1000 + Math.random() * 9000);

     const tempUser = new TempUser({
            userPhoneNumber,
            otp
     })
     if(!tempUser){
            return res.status(400).json({
                message:'Faield to create user',
                success:false
            })
     }
        await tempUser.save();

    //     const message = `Dear customer, your OTP for Login is ${otp}. Use this password to validate your login. Shree Ji Traders`;
    //     console.log('message',message)
    //     const apiUrl = `${process.env.API_URL}&apikey=${process.env.API_KEY}&apirequest=Text&sender=${process.env.SENDER_ID}&mobile=${userPhoneNumber}&message=${message}&route=OTP&TemplateID=${process.env.TEMPLATE_ID}&format=JSON`;
   
    //     const response = await fetch(apiUrl);
    //     const data = await response.json();

        

    //     if (data.status === 'success') {
    //     return res.status(200).json({ status: 200, message: "OTP sent successfully",otp,data,});
    //   } else {
    //     return res.status(500).json({ status: 500, message: "Failed to send OTP", error: data });
    //   }


      const mailOptions = {
      from: "MORE",
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}. It is valid for 1 minute.`,
    };

    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Error sending email", error:error.message, success: false });
      } else {
        console.log("Email sent:", info.response);
        return res.status(200).json({ message: "OTP sent successfully", otp, success: true });
      }
    });
  


    return res.status(200).json({ status: 200, message: "OTP sent successfully",otp,});
    }
    catch(err){
        console.log(err);
        return res.status(500).json({
            message:'Internal server error',
            success:false,
            error:err.message,
        })
    }
}

const userLoginVerify = async(req,res)=>{
    try{
        const {userPhoneNumber,otp} = req.body;
        if(!userPhoneNumber || !otp){
            return res.status(400).json({
                message:'User number and otp is required',
                success:false
            })
        }
        if (!/^\d+$/.test(userPhoneNumber)) {
            return res.status(400).json({ message: 'Invalid phone number. Only digits allowed.',success:false });
        }
    
        
        if (userPhoneNumber.length !== 10) {
            return res.status(400).json({ message: 'Invalid phone number. Must be 10 digits long.',success:false });
        }
        const user = await TempUser.findOne({userPhoneNumber: userPhoneNumber, otp:otp});
        if(!user){
            return res.status(400).json({
                message:'Invalid OTP',
                success:false
            })
        }
        let isOtpExpired = new Date().getTime() - user.updatedAt.getTime();
        if(isOtpExpired > 60000){
            return res.status(400).json({
                message:'OTP expired',
                success:false
            })
        }
        let isOtpCorrect = user.otp == otp;
        if(!isOtpCorrect){
            console.log('otp',otp);
            return res.status(400).json({
                message:'Invalid OTP',
                success:false
            })
        }
        const checkUser = await User.findOne({userPhoneNumber})

        if(checkUser){
            await TempUser.findOneAndDelete({userPhoneNumber:userPhoneNumber});
            return res.status(200).json({
                message:'User login successfully',
                success:true,
                data:checkUser
            })

        }
        
        const newUser = new User({
            userPhoneNumber
        })
        if(!newUser){
            return res.status(400).json({
                message:'User not found',
                success:false
            })
        }
        await newUser.save();
        await TempUser.findOneAndDelete({userPhoneNumber:userPhoneNumber});
        return res.status(201).json({
            message:'User registered successfully',
            success:true,
            data:newUser
        })
    }
    catch(err){
        console.log(err.message);
        return res.status(500).json({
            message:`Internal server error ${err.message}`,
            success:false
        })
    }
}
const userResendOtp = async(req,res)=>{
    try{
    const {userPhoneNumber,email}= req.body;
    if(!userPhoneNumber){
        console.log('userPhoneNumber',userPhoneNumber);
        return res.status(400).json({
            message:'User number is required',
            success:false
        })
    }
    if (!/^\d+$/.test(userPhoneNumber)) {
        return res.status(400).json({ message: 'Invalid phone number. Only digits allowed.',success:false });
    }

    
    if (userPhoneNumber.length !== 10) {
        return res.status(400).json({ message: 'Invalid phone number. Must be 10 digits long.',success:false });
    }
        
       
        let otp = Math.floor(1000 + Math.random() * 9000);
        let tempUser = await TempUser.findOneAndUpdate({userPhoneNumber:userPhoneNumber},{$set:{otp:otp}},{new:true});
        if(!tempUser){
            return res.status(400).json({
                message:'Number is invalid',
                success:false
            })
        }


          const mailOptions = {
      from: "MORE",
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}. It is valid for 1 minute.`,
    };

    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).json({ message: "Error sending email", error:error.message, success: false });
      } else {
        console.log("Email sent:", info.response);
        return res.status(200).json({ message: "OTP sent successfully", otp, success: true });
      }
    });
  
        // const message = `Dear customer, your OTP for Login is ${otp}. Use this password to validate your login. Neargud`;
        // const apiUrl = `${process.env.API_URL}&apikey=${process.env.API_KEY}&apirequest=Text&sender=${process.env.SENDER_ID}&mobile=${userPhoneNumber}&message=${message}&route=OTP&TemplateID=${process.env.TEMPLATE_ID}&format=JSON`;
   
        // console.log('api',apiUrl)
        // const response = await fetch(apiUrl);
        // const data = await response.json();

        return res.status(200).json({
            message:'OTP sent to your number',
            success:true,
            otp,
        })
    }
    
    catch(err){
        console.log(err);
        return res.status(500).json({
            message:`Internal server error ${err.message}`,
            success:false,
            error:err.message,
        })
    }
}
const updateUser = async(req,res)=>{
    try{
      const {userId}  = req.params;
    const {name, userPhoneNumber, bio, userName, email, gender } = req.body;


    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid userId format.",
        });
      }

     let image = null;

    if (req.files) {
        image = req.files.image;
    }
    
    
    const user = await User.findOne({_id:userId})
    if(!user){
        return res.status(404).json({
            message:'user not found',
            success:false,
        })
    }


     // -- check whether user with email or phone already exists
     if (userPhoneNumber) {
        // Phone validation
        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(userPhoneNumber)) {
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


      const existingUserByPhone = await User.findOne({userPhoneNumber
      });
      if (
        userPhoneNumber &&
        existingUserByPhone &&
        existingUserByPhone.userPhoneNumber != user.userPhoneNumber
      ) {
        return res.status(409).json({
          success: false,
          message: "User already exists with this phone number.",
        });
      }

    // Update admin details if provided
    if (name) user.name = name;
    if (userPhoneNumber) user.userPhoneNumber = userPhoneNumber;
    if (bio) user.bio = bio;
    if (userName) user.userName = userName;
    if (gender) user.gender = gender;
    if (email) user.email = email;
    if (image) {
        //delete previous image from cloudinary
        if(user.image){
            const publicId = user.image.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/"); 
            await cloudinary.uploader.destroy(publicId);
        }
      user.image = image[0].path;
    }
    const updatedUser = await user.save();
    return res.status(200).json({
        message:'User updated successfully',
        success:true,
        data:updatedUser,
    })

    }
    catch(err){
        return res.status(500).json({
            message: err.message,
            success:false,
        })
    }
}
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
    const subscription = await subscriptionModel.findOne({ userId: id });

    const isSubscriptionActive = subscription && subscription.endDate > new Date();
    return res.status(200).json({ success: true,getUser: {...getUser.toObject(),isSubscriptionActive} });
  } catch (error) {
    return res.status(500).json({ error: error.message ,success:false});
  }
};
module.exports = {userLogin,userLoginVerify,userResendOtp,updateUser,getUserById};