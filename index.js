process.on("uncaughtException", (err) => {
  console.log("synchronous errors. shutting down");
  console.log(err);
});

import localtunnel from "localtunnel";
import { bot, app } from "./app.js";
import helper from "./utils/helper-base.js";
import { mongo } from "./utils/base-help.js";
// import cron from "./utils/cron-job.js";

// database is set
mongo();

helper.catchAsync(async () => {
  let url = "https://utilsbuybot.fly.dev";
  if (process.env.ENVIRONMENT !== "production") {
    const tunnel = await localtunnel(process.env.PORT, {
      subdomain: "utilsbuybot",
      "Bypass-Tunnel-Reminder": "true",
    });
    url = tunnel.url;
  }
  app.use(await bot.createWebhook({ domain: url, drop_pending_updates: true }));
  process.env.DOMAIN = url;
  console.log(url);
})();

app.listen(process.env.PORT, async () => {
  console.log("Listening on port", process.env.PORT)
  // Delete Purchase Histories
  // await cron.deletePurchaseHistories()
  // Delete Webhook sessions
  // await cron.deleteSessions()
});



process.on("unhandledRejection", async (err) => {
  await helper.sendMessage(
    bot,
    `${process.env.PURCHASE_CHANNEL_ID}`,
    `Asynchronous Error \n\n ${err}`
  );
});

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
