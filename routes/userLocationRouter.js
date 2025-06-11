const express = require('express');
const { userLocation } = require('../controllers/userlocationController');
 
const userLocationRouter = express.Router();
 
userLocationRouter.put('/addlocation/:userId',userLocation);
 

module.exports = userLocationRouter;