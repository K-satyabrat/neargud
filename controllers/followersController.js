const { default: mongoose } = require("mongoose");
const Follower = require("../models/follewerModel")
const User = require("../models/userModel");
const ShopDetails = require("../models/shopModel");

const removeFollower = async (req, res) => {
    try {
        const { userId, followerId } = req.params;

        if (!userId || !followerId) {
            return res.status(400).json({
                message: 'userId and followerId are required',
                success: false
            });
        }

        if (!mongoose.Types.ObjectId.isValid(followerId) || !mongoose.Types.ObjectId.isValid(userId)) {
               return res.status(400).json({
                 success: false,
                 message: "Invalid followerId format or invalid userId format.",
               });
             }

        const follower = await User.findById(followerId);
        if (!follower) {
            return res.status(400).json({
                message: 'follower not found',
                success: false
            });
        }

               // Check if the user is a business account
               const user = await User.findById(userId);
               if (!user || user.accountType !== 'business') {
                   return res.status(400).json({
                       message: 'User type is not business or user not found',
                       success: false
                   });
               }

        // Find the follower document directly
        const followerDoc = await Follower.findOne({ userId });

        if (!followerDoc) {
            return res.status(404).json({
                message: 'Followers not found for this user',
                success: false
            });
        }

 

        // Check if follower exists in the list
        const isFollower = followerDoc.followers.some(f => f.followerId.toString() === followerId);

        if (!isFollower) {
            return res.status(400).json({
                message: 'User is not following this account',
                success: false
            });
        }

        // Remove the follower using $pull
      const updatedFollower = await Follower.updateOne(
            { userId },
            { $pull: { followers: { followerId } } }
        );

        return res.status(200).json({
            message: 'Follower removed successfully',
            success: true,
            data:updatedFollower
        });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({
            message: `Internal server error: ${error.message}`,
            success: false
        });
    }
};


const follow = async (req, res) => {
    try {
        const { followerAcountId, followerId } = req.params;

        if (!followerAcountId || !followerId) {
            return res.status(400).json({
                message: 'followerAcountId and followerId are required',
                success: false
            });
        }

        if (!mongoose.Types.ObjectId.isValid(followerAcountId) || !mongoose.Types.ObjectId.isValid(followerId)) {
            return res.status(400).json({
              success: false,
              message: "Invalid followerAcountId format or invalid followerId format.",
            });
          }

        if(followerAcountId.toString()===followerId.toString()){
            return res.status(400).json({
                message:'user can not follow itself',
                success:false
            })
        }

        // Check if the user (follower) exists
        const user = await User.findById(followerId);
        if (!user) {
            return res.status(400).json({
                message: 'User not found',
                success: false
            });
        }

        const businessUser = await User.findById(followerAcountId);
        if (!businessUser) {
            return res.status(400).json({
                message: 'businessUser not found',
                success: false
            });
        }

        if (!businessUser.accountType==='business') {
            return res.status(400).json({
                message: `${followerAcountId} this is not businessUser`,
                success: false
            });
        }

        // Find or create follower record
        let followerDoc = await Follower.findOne({ userId: followerAcountId });

        if (!followerDoc) {
            followerDoc = new Follower({
                userId: followerAcountId,
                followers: []
            });
        }

        // Check if user is already a follower
        const isAlreadyFollowing = followerDoc.followers.some(f => f.followerId.toString() === followerId);

        if (isAlreadyFollowing) {
            const updatedFollower = await Follower.updateOne(
                { userId:followerAcountId },
                { $pull: { followers: { followerId } } }
            );
            followerDoc = await Follower.findOne({ userId: followerAcountId });
            return res.status(200).json({
                message: 'unfollow successfully',
                success: true,
                data:followerDoc,
                isFollowed:false,
            });
        }

        // Add follower with timestamp
        followerDoc.followers.push({ followerId, addedAt: new Date() });

        // Save the updated document
        await followerDoc.save();

        const shop = await ShopDetails.findOne({ shopkeeperId: followerAcountId }); 
        const isUserEngaged = shop.engagement.some((e)=> e.userId.toString() === followerId)

        if(!isUserEngaged){
          shop.engagement.push({
            userId:followerId,
            engagementType:"follow"
          })
    
          await shop.save()
        }
     

        return res.status(200).json({
            message: 'Followe successfully',
            success: true,
            data: followerDoc,
            isFollowed:true,
        });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({
            message: `Internal server error: ${error.message}`,
            success: false
        });
    }
};



 
 
const getAllFollowers = async (req, res) => {
    try {
        const { userId } = req.params;
        const {comparePreviousMonth } = req.query;

        if (!userId) {
            return res.status(400).json({
                message: 'userId  is required',
                success: false
            });
        }
        
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
              success: false,
              message: "Invalid userId format",
            });
          }

        
        const user = await User.findById(userId);
        if (!user) {
            return res.status(400).json({
                message: "User not found",
                success: false
            });
        }
        // Find followers document
        const followerDoc = await Follower.findOne({ userId });

        if (!followerDoc) {
            return res.status(404).json({
                message: "No followers found for this user",
                success: false
            });
        }

        let followersList = followerDoc.followers;  

       
        // Fetch follower details
        const followerIds = followersList.map(f => f.followerId);
        const followers = await User.find({ _id: { $in: followerIds } }).select("name image");

        let percentageChange = 0;
        let monthFollowers=0
        let comparePreviousMonthSatatusData={}

        // Compare previous month's follower count
        if (comparePreviousMonth) {
            const currentMonth = new Date();
            const previousMonth = new Date();
            previousMonth.setMonth(previousMonth.getMonth() - 1);

            // Get followers added in the previous and current months
            const previousMonthFollowers = followersList.filter(f => 
                f.addedAt >= new Date(previousMonth.getFullYear(), previousMonth.getMonth(), 1) &&
                f.addedAt < new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
            ).length;

            const currentMonthFollowers = followersList.filter(f => 
                f.addedAt >= new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
            ).length;
            monthFollowers=currentMonthFollowers
            comparePreviousMonthSatatusData.monthFollowers=currentMonthFollowers
            comparePreviousMonthSatatusData.previousMonthFollowers=previousMonthFollowers
            // Calculate percentage change
            if (previousMonthFollowers > 0) {
                percentageChange = parseFloat(((currentMonthFollowers - previousMonthFollowers) / previousMonthFollowers) * 100).toFixed(2);
            } else {
                percentageChange = currentMonthFollowers > 0 ? 100 : 0;
            }
            comparePreviousMonthSatatusData.percentageChange=percentageChange
        }

        return res.status(200).json({
            message: "Followers fetched successfully",
            success: true,
            data: followers,
            comparePreviousMonthSatatusData,
        });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({
            message: `Internal server error: ${error.message}`,
            success: false
        });
    }
};


module.exports= {follow,removeFollower,getAllFollowers}