const cron = require("node-cron");
const SubscriptionPlan = require("../models/subscriptionModel");

// Run every day at midnight
cron.schedule("*/5 * * * *", async () => {
  console.log("Running subscription tracker...");

  const now = new Date();

  try {
    const expiredSubs = await SubscriptionPlan.find({
      endDate: { $lte: now },
      nextSubscriptions: { $exists: true, $not: { $size: 0 } },
    });

    for (const sub of expiredSubs) {
      const next = sub.nextSubscriptions.shift(); // Get and remove first from queue

      if (next) {
        sub.subscriptionPlan = next.subscriptionPlan;
        sub.planType = next.planType;
        sub.subscriptionPlanPrice = next.subscriptionPlanPrice;
        sub.features = next.features;
        sub.startDate = next.startDate;
        sub.endDate = next.endDate;
      }

      await sub.save();
      console.log(`Subscription transitioned for user ${sub.userId}`);
    }
  } catch (error) {
    console.error("Cron error:", error.message);
  }
});
