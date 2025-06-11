const aboutUsModel = require("../models/aboutUsModel");
const cloudinary = require("cloudinary").v2;
// @desc to get aboutUs
// @route GET /api/admin/aboutUs/get
const getAboutUs = async (req, res) => {
  try {
    const aboutUs = await aboutUsModel.findOne({});
    if (!aboutUs) {
      return res
        .status(404)
        .json({ message: " No About-US detail found!", status: false });
    }
    return res.status(200).json({ aboutUs });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `server error ${error.message}`, status: false });
  }
};
// @desc to edit aboutUs
// @route PUT /api/aboutUs/edit
const editAboutUs = async (req, res) => {
  try {
    const {content,title} = req.body;
    let image = null
    if(req.files){
      image = req.files.image
    }
  
    const aboutUs = await aboutUsModel.findOne({});


    if (!aboutUs) {
      return res
        .status(404)
        .json({ message: " No About-US detail found!", status: false });
    }

    if(title) aboutUs.title = title;
    if(content) aboutUs.content = content;
    if (image) {
      // Delete the existing image from Cloudinary
      if (aboutUs.imageUrl) {
        const publicId = aboutUs.imageUrl.split("/upload/")[1].split(".")[0].split("/").slice(1).join("/");  // Extract public ID from the URL
        await cloudinary.uploader.destroy(publicId, (error, result) => {
          if (error) {
            console.error("Error deleting image from Cloudinary:", error);
          } else {
            console.log("Image deleted from Cloudinary:", result);
          }
        });
      }
      aboutUs.imageUrl = image[0].path;
    }
 
    const updatedAboutUs = await aboutUs.save();
    return res.status(200).json({
      updatedAboutUs,
      message: "Successfully updated ",
      success: true,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `server error ${error.message}`, success: false });
  }
};
module.exports = { getAboutUs, editAboutUs };