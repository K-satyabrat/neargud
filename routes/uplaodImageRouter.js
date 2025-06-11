const express = require('express');
const multerUpload = require('../middleware/multer');
const { handleImageUpload } = require('../controllers/uploadImageController');
 
const uploadImageRouter = express.Router();
 
uploadImageRouter.post('/uplaodImage',multerUpload.single('image'),handleImageUpload);
 

module.exports = uploadImageRouter;