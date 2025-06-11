const express = require('express');
const { loginAdmin, registerAdmin, getUsers, getUserById, deleteUserById, getAllAdmin, getAdminById, updateAdmin, logoutAdmin, createBusinessUser, updateBusinessUser, getAllBusinessUser, getBusinessUserById, deleteBusinessUserById,} = require('../controllers/adminControllers.js');
const { updateUser } = require('../controllers/userController.js');
 const multer = require("multer");
 const { storage } = require("../utils/cloudinary");
const { getAllReports, getReportById, updateReportStatus, deleteReport } = require('../controllers/reportController.js');
 const upload = multer({ storage });
const adminRoute = express.Router();
 
adminRoute.post("/register", upload.fields([{ name: 'image' }]), registerAdmin);
adminRoute.post('/loginAdmin',loginAdmin)
adminRoute.put('/updateAdmin/:id',upload.fields([{ name: 'image' }]),updateAdmin)
adminRoute.get("/getUserById/:id", getUserById);
adminRoute.post("/logoutAdmin",logoutAdmin);
adminRoute.post("/createBusinessUser",upload.fields([{ name: 'image' }]),createBusinessUser);
adminRoute.put('/updateBusinessUser/:userId',upload.fields([{ name: 'image' }]), updateBusinessUser);
adminRoute.get('/getAllBusinessUser',getAllBusinessUser)
adminRoute.get('/getBusinessUserById/:userId',getBusinessUserById)
adminRoute.delete("/deleteBusinessUserById/:userId",deleteBusinessUserById)

adminRoute.get("/getUsers",getUsers);
adminRoute.put("/updateUser/:userId",upload.fields([{ name: 'image' }]), updateUser)
adminRoute.delete('/deleteUserById/:userId',deleteUserById);
adminRoute.get("/getAllAdmins",getAllAdmin);
adminRoute.get("/getAdminById/:id",getAdminById);
adminRoute.get('/getAllReports', getAllReports);
adminRoute.get('/getReportById/:reportId', getReportById);  
adminRoute.put('/updateReportById/:reportId', updateReportStatus);
adminRoute.delete('/deleteReportById/:reportId', deleteReport);

module.exports=adminRoute