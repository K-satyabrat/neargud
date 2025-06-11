const express = require("express");
const {  userGetCategories, adminGetAllCategories } = require("../controllers/categoriesController");
 
const AdminCategoriesRouter = express.Router();
const UserCategoriesRouter = express.Router();
 
 
AdminCategoriesRouter.get("/getAllCategories",adminGetAllCategories );
UserCategoriesRouter.get("/getAllCategories",userGetCategories);
 
 
module.exports = {AdminCategoriesRouter,UserCategoriesRouter}