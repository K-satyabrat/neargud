const express = require('express');
const { createReport } = require('../controllers/reportController');
const reportRouter = express.Router();
 

reportRouter.post('/createReport', createReport);


module.exports = reportRouter;
