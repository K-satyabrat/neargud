const express = require("express");
const { getTermsAndConditions, editTermsAndConditions } = require("../controllers/termsAndConditionsController");
 
const termsAndConditionsRouter = express.Router();
 
// Get Terms & Conditions
termsAndConditionsRouter.get("/get", getTermsAndConditions);
 
// edit Terms & Conditions
termsAndConditionsRouter.put("/edit", editTermsAndConditions);
 
module.exports = termsAndConditionsRouter;