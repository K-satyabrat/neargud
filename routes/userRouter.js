const express = require('express');
const { userLogin, userLoginVerify, userResendOtp, updateUser, getUserById } = require('../controllers/userController');
const multer = require("multer");
const { storage } = require("../utils/cloudinary");
const upload = multer({ storage });
 
const userRouter = express.Router();
 
userRouter.post('/userLogin', userLogin);
userRouter.post('/verify', userLoginVerify);
userRouter.post('/resend', userResendOtp);
userRouter.put('/updateUser/:userId',upload.fields([{ name: 'image' }]),updateUser),
userRouter.get('/getUserById/:id',getUserById)

module.exports = userRouter;