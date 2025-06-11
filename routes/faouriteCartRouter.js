const express = require("express")
const { addFavoriteItem, removeFavoriteItem, getFavoriteItems } = require("../controllers/faouriteCartController")

const favoriteCartRouter = express.Router()

favoriteCartRouter.post("/addFaouriteItem",addFavoriteItem)
favoriteCartRouter.put("/revoveFaouriteItem/:userId/:itemId",removeFavoriteItem)
favoriteCartRouter.get("/getFaouriteItem/:userId",getFavoriteItems)

module.exports=favoriteCartRouter