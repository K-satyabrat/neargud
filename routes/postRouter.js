const express = require('express');
const { createPost, updatePost, deletePost, getAllPosts, getPostById, getPostsByShopId, likedBy } = require('../controllers/postController');
 const multer = require("multer");
 const { storage } = require("../utils/cloudinary");
 
 const upload = multer({ storage });
 
const newPostrouter = express.Router();
 
newPostrouter.post('/createPost',upload.fields([{ name: 'image' }]), createPost);
newPostrouter.put('/updatePost/:postId',upload.fields([{ name: 'image' }]), updatePost);
newPostrouter.get('/getAllPosts/:userId', getAllPosts);
newPostrouter.delete('/deletePostById/:postId', deletePost);
newPostrouter.get('/getPostById/:postId/:userId', getPostById);
newPostrouter.get('/getPostByShopId/:shopId', getPostsByShopId);
newPostrouter.put("/incrementOrDecrementLikeById/:id/:userId",likedBy)
module.exports = newPostrouter;