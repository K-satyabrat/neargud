// @desc to get terms and condition
 
const Admin = require("../models/adminModel");
const termsAndConditionsModel = require("../models/termsAndConditionsModel");
 
// @route GET /api/termsAndConditions/get
const getTermsAndConditions = async (req, res) => {
  try {
    const termsAndConditions = await termsAndConditionsModel.findOne({});
    const adminProfile = await Admin.findById('67ac6aec29213a88732d98b4')
    if (!termsAndConditions) {
      return res
        .status(404)
        .json({ message: " No Terms and Conditions found!", success: false });
    }
    return res.status(200).json({ adminProfile,termsAndConditions, success: true });
  } catch (error) {
    return res
      .status(500)
      .json({ error: `server error ${error.message}`, success: false });
  }
};
// @desc to edit terms and condition
// @route PUT /api/admin/termsAndConditions/edit
const editTermsAndConditions = async (req, res) => {
  try {
    const {title, content} = req.body;

    const termsAndConditions = await termsAndConditionsModel.findOne({});
    if (!termsAndConditions) {
      return res
        .status(404)
        .json({ message: " No Terms and Conditions found!", success: false });
    }
    if(title) termsAndConditions.title = title;
    if(content) termsAndConditions.content = content;
    const updatedTermsAndConditions = await termsAndConditions.save();
    return res.status(200).json({
      updatedTermsAndConditions,
      message: "Successfully updated ",
      success: true,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: `server error ${error.message}`, success: false });
  }
};
module.exports = { getTermsAndConditions, editTermsAndConditions };