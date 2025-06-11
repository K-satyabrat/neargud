const express = require("express");
const { getPrivacyAndPolicy, editPrivacyAndPolicy } = require("../controllers/privacyAndPolicyController");
 
const privacyAndPolicyRouter = express.Router();
 
// Get privacyAndPolicy
privacyAndPolicyRouter.get("/get", getPrivacyAndPolicy);
 
// edit privacyAndPolicy
privacyAndPolicyRouter.put("/edit", editPrivacyAndPolicy);
module.exports = privacyAndPolicyRouter;