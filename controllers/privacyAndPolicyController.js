// @desc to get privacyAndPolicy
 
const Admin = require("../models/adminModel");
const privacyAndPolicyModel = require("../models/privacyAndpolicyModel");

 
// @route GET /api/privacyAndPolicy/get
const getPrivacyAndPolicy = async (req, res) => {
  try {
    const privacyAndPolicy = await privacyAndPolicyModel.findOne({});
      const adminProfile = await Admin.findById('67ac6aec29213a88732d98b4')
    if (!privacyAndPolicy) {
      return res
        .status(404)
        .json({ message: " No Privacy  and Policy  found!", success: false });
    }
    return res.status(200).json({adminProfile, privacyAndPolicy,success:true });
  } catch (error) {
    return res
      .status(500)
      .json({ error: `server error ${error.message}`, success: false });
  }
};
// @desc to edit privacyAndPolicy
// @route PUT /api/admin/privacyAndPolicy/edit
const editPrivacyAndPolicy = async (req, res) => {
  try {
    const {title, content} = req.body;
 
    const privacyAndPolicy = await privacyAndPolicyModel.findOne({});
    if (!privacyAndPolicy) {
      return res
        .status(404)
        .json({ message: " No Privacy and Policy found!", success: false });
    }
    if(title) privacyAndPolicy.title = title;
    if(content) privacyAndPolicy.content = content;
    const updatedPrivacyAndPolicy = await privacyAndPolicy.save();
    return res.status(200).json({
      updatedPrivacyAndPolicy,
      message: "Successfully updated ",
      success: true,
    });
  
  } catch (error) {
    return res
      .status(500)
      .json({ message: `server error ${error.message}`, success: false });
  }
};
module.exports = { getPrivacyAndPolicy, editPrivacyAndPolicy };