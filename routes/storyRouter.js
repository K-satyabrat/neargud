const express = require("express");
 
const multer = require("multer");
const { storage } = require("../utils/cloudinary");
const { createStory, viewStory, getStories, deleteStory, getStoryViewCount } = require("../controllers/storyController");
 
const upload = multer({ storage });
 
const storyRoute = express.Router();
 
 
 
storyRoute.post("/createStory", upload.single("mediaUrl"), createStory);
storyRoute.put("/viewStory/:storyId/:userId", viewStory);
storyRoute.get("/getStories/:userId", getStories);
storyRoute.get("/viewStoryCount/:storyId/:userId",getStoryViewCount );
storyRoute.delete("/deleteUserStory/:storyId/:userId", deleteStory);
 
 
module.exports =  storyRoute;