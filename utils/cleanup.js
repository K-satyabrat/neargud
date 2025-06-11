const cron = require("node-cron");
const TempUser = require("../models/tempUserModel");
 
cron.schedule("*/10 * * * *", async () => {
    try {
        const expirationTime = new Date(Date.now() - 10 * 60 * 1000);
        await TempUser.deleteMany({ updatedAt: { $lt: expirationTime } });
        console.log("Expired TempUser records cleaned up.");
    } catch (err) {
        console.error("Error deleting expired TempUser records:", err);
    }
});


