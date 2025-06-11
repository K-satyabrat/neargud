
const express = require('express');
const { getTermsAndConditions } = require('../controllers/termsAndConditionsController');
 
const userTermsAndConditionsRouter = express.Router();

userTermsAndConditionsRouter.get('/getTermsAndConditions', getTermsAndConditions);

module.exports = userTermsAndConditionsRouter;