const express = require('express')
const { createCampaign, updateCampaign, getCampaigns, deleteCampaign, getCompaignById, getAllCampaignsByLocation } = require('../controllers/campaginController')
 
const campaignRoute = express.Router()
const userCampaignRoute = express.Router()

campaignRoute.post('/createCampaign',createCampaign)
campaignRoute.put('/updateCampaignById/:id',updateCampaign)
campaignRoute.get('/getAllCampaigns',getCampaigns)
campaignRoute.get('/getCampaignById/:id',getCompaignById)
campaignRoute.delete('/deleteCampaignById/:id',deleteCampaign)
userCampaignRoute.get('/getAllCampaignsByCity',getAllCampaignsByLocation)


module.exports={campaignRoute,userCampaignRoute}