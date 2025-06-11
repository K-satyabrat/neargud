const express = require('express');
const { createShop, getShopDetails, updateShop, deleteShop, getAllShops, likedBy, getMonthlyVisitorStats, getUniqueShopAddresses, getShopsByUserId, getMonthlyShopEngagementStats } = require('../controllers/shopController');
const shopRouter = express.Router();
const multer = require("multer");
const { storage } = require("../utils/cloudinary");
const upload = multer({ storage });
 
shopRouter.post('/create',upload.fields([{ name: 'image' }]), createShop);
shopRouter.get('/getShopDetails/:shopId/:userId', getShopDetails);
shopRouter.put('/updateShopDetails/:shopId',upload.fields([{ name: 'image' }]), updateShop);
shopRouter.delete('/deleteShopDetails/:shopId', deleteShop);
shopRouter.get('/getAllShops/:userId', getAllShops);
shopRouter.put('/incrementOrDecrementLikeById/:id/:userId', likedBy);
shopRouter.get('/getMonthlyVisitorStats/:shopId', getMonthlyVisitorStats);
shopRouter.get('/getShopsAddress', getUniqueShopAddresses);
shopRouter.get('/getShopsByUserId/:userId', getShopsByUserId);
shopRouter.get('/getMonthlyShopEngagementStats/:shopId', getMonthlyShopEngagementStats);

module.exports = shopRouter;