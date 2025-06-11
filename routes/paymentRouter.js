const express = require('express');
const { getOrderId, validateSuccess } = require('../controllers/paymentController');
 
const paymentRouter = express.Router();
 
paymentRouter.post('/getOrderId',getOrderId);
paymentRouter.put('/validateSuccess',validateSuccess);
 
module.exports = paymentRouter;