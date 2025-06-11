const express = require("express")
const { follow, unfollow, removeFollower, getAllFollowers } = require("../controllers/followersController")
 
const followerRouter = express.Router()

followerRouter.put("/followUnfollow/:followerAcountId/:followerId",follow)
followerRouter.put('/removeFollower/:userId/:followerId',removeFollower)
followerRouter.get('/getAllFollowers/:userId',getAllFollowers)
 

module.exports=followerRouter