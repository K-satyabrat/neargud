const express = require('express')
const { createGroupChat, addMember, updateGroupDetails, leaveGroup, updateGroupChat, getAllChatsByStatus, getUserDetailsByChatId, oneToOneChat, deleteChatById, getGroupDetails, blockChat, getFollowerForChat } = require('../controllers/chatController')
const multer = require("multer");
const { storage } = require("../utils/cloudinary");
const upload = multer({ storage });

const chatRouter = express.Router()

chatRouter.post('/createGroupChat',upload.fields([{ name: 'image' }]),createGroupChat)
chatRouter.put('/updateGroupChat/:chatId/:userId',upload.fields([{ name: 'image' }]),updateGroupChat)
chatRouter.put('/leaveGroup/:chatId/:userId',leaveGroup)
chatRouter.get('/getUserDetailsByChatId/:chatId',getUserDetailsByChatId)
chatRouter.post('/oneToOneChat',oneToOneChat)
chatRouter.get('/getAllChsatsByStatus',getAllChatsByStatus)
chatRouter.get('/getChatDetails/:chatId',getGroupDetails)
chatRouter.delete('/deleteChat/:chatId/:adminId', deleteChatById);
chatRouter.put('/updateBlockChat/:chatId',upload.fields([ ]),blockChat)
chatRouter.get('/getFollowersByChatId/:chatId',getFollowerForChat)

module.exports=chatRouter