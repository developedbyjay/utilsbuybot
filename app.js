// NPM MODULES
import dotenv from "dotenv";
import { Scenes, session, Telegraf } from "telegraf";
import express from "express";

//  MIDDLEWARES
import create from "./middlewares/create.js";
import interface_action from "./middlewares/interface.js";
import history_action from "./middlewares/history.js";
import price_action from "./middlewares/prices.js";
import control_action from "./middlewares/control.js";
import settings_action from "./middlewares/settings.js";

// TELEGRAF SCENES
import data_plan from "./scenes/data.js";
import airtime from "./scenes/airtime.js";
import set_key from "./scenes/set-key.js";
import reset_key from "./scenes/reset-key.js";

// EXPRESS ROUTES AND OTHERS
import userRoutes from "./routes/user.js";
import dataRoutes from "./routes/data.js";
import networkRoutes from "./routes/network.js";
import historyRoutes from "./routes/history.js";
import sessionsRoutes from "./routes/sessions.js";
import globalErrorHandler from "./controllers/error.js";

import {
  rateLimit,
  checkAndProcessPayment,
  updateUserAccount,
} from "./utils/base-help.js";
import helper, { helper_base } from "./utils/helper-base.js";

dotenv.config({ path: "config.env" });

const bot = new Telegraf(process.env.TOKEN);
const app = express();

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// if (process.env.ENVIRONMENT !== "production") {
//   app.use(morgan("dev"));
// }

app.use("/api/v1/users", userRoutes);
app.use("/api/v1/networks", networkRoutes);
app.use("/api/v1/dataplans", dataRoutes);
app.use("/api/v1/history", historyRoutes);
app.use("/api/v1/sessions", sessionsRoutes);
app.post("/api/vpay/webhook", async (request, response) => {
  await checkAndProcessPayment(request.body);
});
app.post("/api/vpay/update_webhook", async (request, response) => {
  await updateUserAccount(request.body);
});

const { Stage } = Scenes;

const stage = new Stage([data_plan, airtime, set_key, reset_key]);

bot
  .use((ctx, next) => rateLimit(ctx, next))
  .use(session({ defaultSession: () => ({}) }))
  .use(stage.middleware())
  .use(create)
  .use(interface_action)
  .use(history_action)
  .use(price_action)
  .use(control_action)
  .use(settings_action);

app.use(globalErrorHandler);

export { bot, app };
