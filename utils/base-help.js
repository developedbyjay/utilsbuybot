import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { RateLimiterMemory } from "rate-limiter-flexible";
import User from "../models/user.js";
import History from "../models/history.js";
import helper from "./helper-base.js";
import helper_scene from "../utils/helper-scene.js";
import { bot } from "../app.js";
import Sessions from "../models/sessions.js";
import { request } from "../requests/post.js";
import { startHandler } from "../helpers/handler.js";

const ratelimiter = new RateLimiterMemory({
  points: 1,
  duration: 1,
});

export const rateLimit = async (ctx, next) => {
  try {
    await ratelimiter.consume(ctx.chat.id);
    next();
  } catch (e) {
    await helper.ansQ(ctx, "kindly click buttons once...");
  }
};

export const maskedCharacters = (char, n) => {
  const str = char + "";
  const last = str.slice(n);
  return last.padStart(str.length, "*");
};

export const userAccountText = (user) => {
  let account_details = "";
  user.account_number.forEach((el) => {
    account_details += `BANK-NAME: <b>${el.bank}</b>\nACCOUNT-NUMBER: <b>${el.nuban
      }</b>\nACCOUNT-NAME: <b>${el.bank === "Providus Bank"
        ? "VPAY COLLECTION"
        : user.account_name.replace(user.account_name, "UTILSBUYBOT")
      }</b>\n\n`;
  });
  return account_details;
};

export const change_host = async (ctx) => {
  switch (`${ctx.session.MODEL}`) {
    case "LOADED":
      ctx.session.hostname = "arisedataapi.com.ng";
      break;
    case "RE-LOADED":
      ctx.session.hostname = "benzoni.ng";
      break;
    default:
      console.log(`hostname changed`);
  }
};

//  RECEIVING WEBHOOK UPDATES (VIRTUAL PAYMENT)
export const checkAndProcessPayment = async (req) => {
  let user;
  try {
    const check_session = await Sessions.findOne({ id: req.session_id });
    if (check_session) return;
    const process_fee = 30;
    await Sessions.create({ id: req.session_id });
    user = await User.findOne({
      "account_number.nuban": { $in: [req.account_number] },
    });
    const amount = Number(req.amount) - process_fee;
    user.wallet += amount;
    user.total_wallet += amount;
    await user.save();
    const text = `<b>ACCOUNT HAS BEEN CREDITTED WITH #${amount}</b>\n<code>processing fee of #${process_fee} was charged..</code>\n\n<b>WALLET BALANCE: #${user.wallet}</b>`;
    const btn = [
      [{ text: "BUY UTILITY", callback_data: "proceed" }],
      [
        { text: "PROFILE", callback_data: "profile_alert" },
        { text: "HOME PAGE", callback_data: "homepage" },
      ],
    ];
    await helper.sendButtons(bot, user.id, text, btn);
    await helper.sendMessage(
      bot,
      process.env.PURCHASE_CHANNEL_ID,
      `USER WITH THE ID ${user.id
      } FUND THEIR WALLET WITH #${amount} \n \nBALANCE BEFORE: #<b>${user.wallet - amount
      }</b> \nBALANCE AFTER: #<b>${user.wallet}</b>`
    );
  } catch (err) {
    await helper.sendMessage(bot, process.env.ERRORS_CHANNEL_ID, err.message);
    await helper.sendMessage(
      bot,
      user.id,
      `<code>Can't receieve payments at the moment, kindly make use of the other bank number</code>`
    );
  }
};

//  RECEIVING WEBHOOK UPDATES (ACCOUNT NUMBER UPDATE  )
export const updateUserAccount = async (req) => {
  let user;
  try {
    user = await User.find({ email: req.data.email });
    if (!user) return;
    user.account_number = req.data.virtualaccounts;
    await user.save();
    const text = `<b>ACCOUNT DETAILS UPDATED SUCCESSFULLY...</b>\n <code>Click "PROFILE" to verify..</code>`;
    await bot.telegram.editMessageText(user.id, text, {
      parse_mode: "html",
      reply_markup: {
        inline_keyboard: [
          [{ text: "PROFILE", callback_data: "profile_alert" }],
        ],
      },
    });
  } catch (err) {
    await helper.sendMessage(bot, process.env.ERRORS_CHANNEL_ID, err.message);
    await helper.sendMessage(
      bot,
      user.id,
      `<code>Can not update account details at the moment, Try again Later</code>`
    );
  }
};

export const mongo = helper.catchAsync(async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(process.env.DATABASE);
  console.log("DB connected");
});

export const createSendToken = (user) => {
  let id = user._id;
  const token = jwt.sign({ id }, process.env.JWT_SECRET);
  return token;
};

export const getUser = helper.catchAsync(async (user_id) => {
  return await User.findOne({ id: +user_id });
});

export const useDate = () => {
  const date = new Date();
  const options = { timeZone: "Africa/Lagos" };
  return date.toLocaleString("en-US", options);
};

export const createHistory = helper.catchAsync(async (ctx) => {
  await History.create({
    id: ctx.chat.id,
    status: ctx.session.status,
    network: ctx.session.network_name,
    phoneNumber: ctx.session.mobile,
    request:
      ctx.session.msg === "topup" ? ctx.session.creditAmount : ctx.session.plan,
    type: ctx.session.msg === "topup" ? "airtime" : "data",
    date_created: useDate(),
  });
});

export const loadRequest = helper.catchAsync(async (ctx, next) => {
  const { wallet } = await getUser(ctx.chat.id);

  if (!ctx.session.network_name) {
    const check = await helper.channelStatus(ctx);
    return startHandler({ ctx, check });
  }
  let path;
  if (ctx.session.request === "airtime") {
    if (+wallet >= +ctx.session.creditAmount) {
      switch (ctx.session.hostname) {
        case "arisedataapi.com.ng":
          path = `{\"network\": ${ctx.session.network_id
            },\r\n \"amount\" :${Math.round(
              +ctx.session.creditAmount
            )}, \r\n \"mobile_number\": "${ctx.session.mobile
            }",\r\n \"Ported_number\":true,\r\n \"airtime_type\":\"VTU\"}`;
          break;
        case "benzoni.ng":
          path = `/api/v2/airtime/?api_key=${process.env.API_2}&product_code=${ctx.session.network_id_2
            }&phone=${ctx.session.mobile}&amount=${+ctx.session.creditAmount}`;
          break;
        default:
          console.error("error from switching api");
      }
      await request(
        ctx,
        path,
        "topup",
        +ctx.session.creditAmount,
        ctx.session.hostname
      );

      return await ctx.scene.leave();
    }
    return await helper_scene.walletBalanceLess(ctx);
  }
  if (ctx.session.request === "data") {
    if (+wallet >= +ctx.session.plan_amount) {
      switch (ctx.session.hostname) {
        case "arisedataapi.com.ng":
          path = `{\"network\": ${+ctx.session.planDetails
            .network},\r\n\"mobile_number\": "${ctx.session.mobile
            }",\r\n\"plan\": ${+ctx.session.planDetails
              .dataplan_id},\r\n\"Ported_number\":true}`;

          break;
        case "benzoni.ng":
          path =
            ctx.session.network_id_2 === "mtn_custom" &&
              ctx.session.planDetails.plan_type === "GT"
              ? `/api/v2/directdata/?api_key=${process.env.API_2}&product_code=${ctx.session.planDetails.dataplan2_id}&phone=${ctx.session.mobile}`
              : `/api/v2/datashare/?api_key=${process.env.API_2}&product_code=${ctx.session.planDetails.dataplan2_id}&phone=${ctx.session.mobile}`;

          break;
        default:
          console.error("error from switching api");
      }
      await request(
        ctx,
        path,
        "data",
        +ctx.session.plan_amount,
        ctx.session.hostname
      );
      return await ctx.scene.leave();
    }
    return await helper_scene.walletBalanceLess(ctx);
  }
});

export const send_request_func = async (ctx, text) => {
  await helper.ansQdel(ctx, "processing your request, please wait ....");
  ctx.session.request = text;
  await change_host(ctx);
  await ctx.persistentChatAction("typing", async () => {
    await loadRequest(ctx);
  });
};

export const return_back_func = async (ctx, text, button, step) => {
  await helper.ansQdel(ctx, "processing...");
  await helper.sendKeyboards(ctx, ctx.chat.id, text, button);
  return ctx.wizard.selectStep(step);
};
