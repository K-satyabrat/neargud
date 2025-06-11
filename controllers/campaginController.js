const { default: mongoose } = require("mongoose");
const Campaign = require("../models/campaginModel");
const cloudinary = require("cloudinary").v2;
 

 
const createCampaign = async (req, res) => {
  try {
    const { city, state, carousel } = req.body;

    if (!city || !state || !carousel || !Array.isArray(carousel)) {
      return res.status(400).json({ message: "Missing required fields or invalid format.",success:false });
    }

    const newCampaign = new Campaign({ city, state, carousel });
    await newCampaign.save();

    res.status(201).json({ message: "Campaign created successfully",success:true, campaign: newCampaign });
  } catch (error) {
    res.status(500).json({ message: `Internal Server Error ${error.message}`,  success:false });
  }
};
 
// get campaign
 const getCampaigns = async (req, res) => {
  try {
    // Parse limit and page with default values
    const limit = parseInt(req.query.limit) || 10;
    const page = parseInt(req.query.page) || 1;
 
    if (limit <= 0 || page <= 0) {
      return res.status(400).json({
        success: false,
        message: "Page and limit must be positive numbers",
      });
    }
 
    // Get total count
    const totalRecords = await Campaign.countDocuments();
    const totalPage = Math.ceil(totalRecords / limit);
 
    // Fetch campaigns with pagination
    const campaigns = await Campaign.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
 
    return res.status(200).json({
      success: true,
      campaigns,
      currentPage: page,
      totalRecords,
      totalPage,
      hasNextPage: page < totalPage,
      hasPrevPage: page > 1,
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return res.status(500).json({
      success: false,
      message: `Internal Server Error ${error.message}`,
      error: error.message,
    });
  }
};
 
// get compaign by id
const getCompaignById = async (req, res) => {
  try {
    const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid id format.",
        });
      }
 
    // Find the campaign by ID
    const campaign = await Campaign.findById(id);
 
    // If campaign not found
    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found",
      });
    }
 
    // Return the campaign details
    return res.status(200).json({
      success: true,
      message: "Campaign fetched successfully",
      campaign,
    });
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
 
 
const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;


    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Campaign ID is required." });
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid id format.",
      });
    }
    
    const updatedCampaign = await Campaign.findByIdAndUpdate(id, updates, { new: true, runValidators: true });

    if (!updatedCampaign) {
      return res.status(404).json({ message: "Campaign not found",success:false });
    }

    res.status(200).json({ message: "Campaign updated successfully",success:true, campaign: updatedCampaign });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", success:false});
  }
};
 
 
// delete campaign
 const deleteCampaign = async (req, res) => {
  try {
    const { id } = req.params;
 
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Campaign ID is required." });
    }
 
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid id format.",
      });
    }
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res
        .status(404)
        .json({ success: false, message: "Campaign not found." });
    }
 
    // Delete the campaign from database
    const deletedCampaign =await Campaign.findByIdAndDelete(id);
    if(deletedCampaign){
      deletedCampaign.carousel.map(async (item) => {
        const publicId = item.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/"); // Extract public ID from the URL
        await cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) {
            console.error("Error deleting image from Cloudinary:", error);
          } else {
            console.log("Image deleted from Cloudinary:", result);
          }
        });
      });
    }
 
    res.status(200).json({
      success: true,
      message: "Campaign deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting campaign",
      error: error.message,
    });
  }
};

const getAllCampaignsByLocation = async (req, res) => {
  try {
    const { city} = req.query;
    if (!city ) {
      return res.status(400).json({ message: "City and state are required", success: false });
    }
    const campaigns = await Campaign.find({ city: { $regex: city, $options: "i" } });
    res.status(200).json({ message: "Campaigns fetched successfully", success: true, campaigns });

    } catch (error) {
    console.error("Error fetching campaigns:", error);
    return res.status(500).json({ message: "Internal Server Error", success: false });
  
}
  
  }

module.exports={createCampaign,getCampaigns,getCompaignById,deleteCampaign,updateCampaign,getAllCampaignsByLocation}