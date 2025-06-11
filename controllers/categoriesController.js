const {categories} = require('../constants/categories')
 
 
 
const userGetCategories = (req, res) => {
    const categoryName = req.query.name;
  
    if (!categoryName) {
      return res.status(200).json({ message: "Categories fetched successfully", success: true, data: categories });
    }
   
    const category = categories.find(
      (cat) => cat.category.toLowerCase() === categoryName.toLowerCase()
    );
   
    if (!category) {
      return res
        .status(404)
        .json({ success: false, message: "Category not found" });
    }
   
    res.status(200).json({ success: true, data: category });
 
  };
 
 
 
// Helper function to remove 'image' from any object
const removeImage = (obj) => {
  if (typeof obj === 'object' && obj !== null) {
    const { image, ...rest } = obj;
    return rest;
  }
  return obj; // if it's a string like "Kids", keep it
};
 
// Helper function to clean subcategories
const cleanSubcategories = (subcategories) => {
  if (!subcategories) return null;
 
  const cleaned = { ...subcategories };
 
  // Clean 'category' array
  if (Array.isArray(cleaned.category)) {
    cleaned.category = cleaned.category.map(removeImage);
  }
 
  // Clean 'subcategory' object
  if (cleaned.subcategory && typeof cleaned.subcategory === 'object') {
    const cleanedSubcategory = {};
    for (const key in cleaned.subcategory) {
      if (Array.isArray(cleaned.subcategory[key])) {
        cleanedSubcategory[key] = cleaned.subcategory[key].map(removeImage);
      } else {
        cleanedSubcategory[key] = cleaned.subcategory[key];
      }
    }
    cleaned.subcategory = cleanedSubcategory;
  }
 
  return cleaned;
};
 
// Controller
const adminGetAllCategories = (req, res) => {
  try {
    const categoryName = req.query.name;
 
    const sanitizeCategory = ({ image, subcategories, ...rest }) => {
      return {
        ...rest,
        subcategories: cleanSubcategories(subcategories),
      };
    };
 
    if (!categoryName) {
      const categoriesWithoutImage = categories.map(sanitizeCategory);
 
      return res.status(200).json({
        success: true,
        message: "Admin: Categories fetched successfully (without images)",
        data: categoriesWithoutImage,
      });
    }
 
    const category = categories.find(
      (cat) => cat.category.toLowerCase() === categoryName.toLowerCase()
    );
 
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
 
    const categoryWithoutImage = sanitizeCategory(category);
 
    return res.status(200).json({
      success: true,
      message: "Category found successfully",
      data: categoryWithoutImage,
    });
 
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Admin: Failed to fetch categories",
      error: error.message,
    });
  }
};
 
   
 
module.exports = {userGetCategories,adminGetAllCategories };