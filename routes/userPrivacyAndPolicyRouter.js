
const express = require('express');
const { getPrivacyAndPolicy } = require('../controllers/privacyAndPolicyController');

const userPrivacyAndPolicyRouter = express.Router();

userPrivacyAndPolicyRouter.get('/getPrivacyAndPolicy', getPrivacyAndPolicy);

module.exports = userPrivacyAndPolicyRouter;