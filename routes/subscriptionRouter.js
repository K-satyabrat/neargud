const express = require('express');
const { getOrderId, validateSuccess, getSubscription } = require('../controllers/subscriptionController');
 
const subscriptionRouter = express.Router();
 
subscriptionRouter.post('/addSubscription',getOrderId);
subscriptionRouter.post('/validateSubscription',validateSuccess);
subscriptionRouter.get('/getSubscription/:userId',getSubscription);
 
module.exports = subscriptionRouter;