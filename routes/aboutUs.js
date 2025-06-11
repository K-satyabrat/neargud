const express = require("express");
const { getAboutUs, editAboutUs } = require("../controllers/aboutUsController");
 const multer = require("multer");
 const { storage } = require("../utils/cloudinary");
 const upload = multer({ storage });
 
const aboutUsRouter = express.Router();
 
// Get aboutUs
aboutUsRouter.get("/get", getAboutUs);
 
// edit edit
aboutUsRouter.put("/edit",upload.fields([{ name: 'image' }]), editAboutUs);
 
module.exports = aboutUsRouter;