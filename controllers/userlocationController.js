const { default: mongoose } = require("mongoose");
const User = require("../models/userModel");
const getAddressFromCoordinates = require("../utils/getLocationByCoordinate");

 

const userLocation = async (req, res) => {
    try {
        const { userId } = req.params;
        const { latitude, longitude } = req.body;

        // Validate input
        if (!latitude || !longitude) {
            return res.status(400).json({
                message: 'Latitude and Longitude are required',
                success: false,
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({
              success: false,
              message: "Invalid userId format.",
            });
          }

        // Validate Latitude & Longitude Range
        if (
            isNaN(latitude) || isNaN(longitude) || 
            latitude < -90 || latitude > 90 || 
            longitude < -180 || longitude > 180
        ) {
            return res.status(400).json({
                message: 'Invalid latitude or longitude values',
                success: false,
            });
        }

        // Validate userId
        if (!userId) {
            return res.status(400).json({
                message: 'UserId is required',
                success: false,
            });
        }

        let address = await getAddressFromCoordinates(latitude,longitude,res)

        if(!address){
            return res.status(400).json({
                message:"Invalid coordinates",
                success:false
            })
        }

        // Update user location in one query
        const user = await User.findByIdAndUpdate(
            userId,
            {
                location: {
                    type: 'Point',
                    coordinates: [parseFloat(longitude), parseFloat(latitude)]
                },
                address:address
            },
            { new: true } // Returns updated user
        );

        if (!user) {
            return res.status(404).json({
                message: 'User not found',
                success: false,
            });
        }

        return res.status(200).json({
            message: 'Location updated successfully',
            success: true,
            data: user,
        });
    } catch (err) {
        console.error("Error updating location:", err);
        return res.status(500).json({
            message: 'Internal server error',
            success: false,
        });
    }
};

module.exports={userLocation}