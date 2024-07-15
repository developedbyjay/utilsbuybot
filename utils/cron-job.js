import node_cron from "node-cron";
import Histories from "../models/history.js";
import Sessions from "../models/sessions.js";
import helper from "./helper-base.js";
import { bot } from "../app.js";
import { useDate } from "./base-help.js";

class Cron {
  
  filter(day) {
    const xDaysAgo = new Date();
    xDaysAgo.setDate(this.xDaysAgo.getDate() - day);
    return { $lt: xDaysAgo };
  }
  
  async deletePurchaseHistories() {
    try {
      node_cron.schedule("0 0 21 * * *", async () => {
        await Histories.deleteMany({
          createdAt: this.filter(7),
        });
        await helper.sendMessage(
          bot,
          process.env.PURCHASE_CHANNEL_ID,
          `HISTORIES DELETED: ${useDate()}`
        );
      });
    } catch (err) {
      await helper.sendMessage(bot, process.env.ERRORS_CHANNEL_ID, err.message);
    }
  }

  async deleteSessions() {
    try {
      node_cron.schedule("0 0 0 */3 * 0 ", async () => {
        await Sessions.deleteMany({
          createdAt: this.filter(1),
        });
        await helper.sendMessage(
          bot,
          process.env.PURCHASE_CHANNEL_ID,
          `SESSIONS DELETED: ${useDate()}`
        )
      });
    } catch (err) {
      await helper.sendMessage(bot, process.env.ERRORS_CHANNEL_ID, err.message);
    }
  }
}

export default new Cron();
