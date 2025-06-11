const express = require('express');
const cors = require('cors');

const mongoDbConnection = require('./config/mongoDbConnection');
const userRouter = require('./routes/userRouter');
const userLocationRouter = require('./routes/userLocationRouter');
const uploadImageRouter = require('./routes/uplaodImageRouter');
const shopRouter = require('./routes/shopRouter');
const subscriptionRouter = require('./routes/subscriptionRouter');
const adminRoute = require('./routes/adminRouter');
const aboutUsRouter = require('./routes/aboutUs');
const privacyAndPolicyRouter = require('./routes/privacyAndPolicyRouter');
const termsAndConditionsRouter = require('./routes/termsAndConditionsRouter');
const newPostrouter = require('./routes/postRouter');
const userPrivacyAndPolicyRouter = require('./routes/userPrivacyAndPolicyRouter');
const userTermsAndConditionsRouter = require('./routes/userTermsAndConditionsRouter');
const userAboutUsRouter = require('./routes/userAboutUsRouter');
const cookieParser = require("cookie-parser");
 
const shopReviewsRouter = require('./routes/shopReviewsRouter');
const http = require("http");
const { socketHandler } = require('./utils/socketHandler');
const notificationRouter = require('./routes/notificationRouter');
const favoriteCartRouter = require('./routes/faouriteCartRouter');
const followerRouter = require('./routes/followerRouter');
const messageRouter = require('./routes/messageRouter');
const chatRouter = require('./routes/chatRouter');
const reelsRoute = require('./routes/reelRouter');
const storyRoute = require('./routes/storyRouter');
const reportRouter = require('./routes/reportRouter');
const { campaignRoute, userCampaignRoute } = require('./routes/campaignRouter');
const { AdminCategoriesRouter, UserCategoriesRouter } = require('./routes/categoriesRouter');
const path = require("path");
require("./utils/cleanup");
require("./utils/subscriptionTracker")
require('dotenv').config();

const app = express();

const server = http.createServer(app);
const io =require("socket.io")(server,{
  cors:{
    origin: '*', optionsSuccessStatus: 200
  }
});
socketHandler(io)

app.use(cors({ origin: '*', optionsSuccessStatus: 200 }));
app.use(cookieParser());

app.use(
  "/neargud/constants/categoriesImages",
  express.static(path.join(__dirname, "constants/categoriesImages"))
);

app.use(express.json());
app.use(express.urlencoded({extended: true}));
mongoDbConnection();
 
app.get('/', (req,res)=>{
    res.send(`
    <html>
      <head><title>Neargud Project BE</title></head>
      <body>
        <h1>Welcome to Neargud Project</h1>
      </body>
    </html>
  `);
})
 
app.use('/api/admin',adminRoute)
app.use('/api/admin/aboutUS',aboutUsRouter)
app.use('/api/admin/policyAndPrivacy',privacyAndPolicyRouter)
app.use('/api/admin/termsAndConditions',termsAndConditionsRouter)
app.use('/api/admin/campaign',campaignRoute)
app.use('/api/user',userRouter)
app.use('/api/user/location',userLocationRouter)
app.use('/api/image',uploadImageRouter)
app.use('/api/user/shop',shopRouter)
app.use('/api/user/subscription',subscriptionRouter)
app.use('/api/user/post',newPostrouter)
app.use('/api/user/policyAndPrivacy',userPrivacyAndPolicyRouter)
app.use('/api/user/termsAndConditions',userTermsAndConditionsRouter)
app.use('/api/user/aboutUs',userAboutUsRouter)
app.use('/api/user/shopReviews',shopReviewsRouter)
app.use('/api/admin/notification',notificationRouter)
app.use('/api/user/faouriteCart',favoriteCartRouter)
app.use('/api/user/notification',notificationRouter)
app.use('/api/user/follower',followerRouter)
app.use('/api/user/chat',chatRouter)
app.use("/api/user/messages", messageRouter);
app.use("/api/user/reel", reelsRoute);
app.use("/api/user/story", storyRoute);
app.use("/api/user/report", reportRouter);
app.use('/api/user/campaign',userCampaignRoute)
app.use("/api/admin/categories",AdminCategoriesRouter);
app.use("/api/user/categories",UserCategoriesRouter);

 
server.listen(process.env.PORT || 8000, ()=>{
    console.log(`server started at port ${process.env.PORT?process.env.PORT:'8000'}`);
})

