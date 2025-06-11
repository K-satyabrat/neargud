
const express = require('express');
const { getAboutUs } = require('../controllers/aboutUsController');
 
const userAboutUsRouter = express.Router();

userAboutUsRouter.get('/getAboutUs', getAboutUs);

module.exports = userAboutUsRouter;


 