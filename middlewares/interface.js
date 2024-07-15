import { Composer, Markup } from "telegraf";
import helper, { helper_base } from "../utils/helper-base.js";
import { startHandler } from "../helpers/handler.js";
import {
  userAccountText,
  maskedCharacters,
  getUser,
  loadRequest,
  change_host,
} from "../utils/base-help.js";
import { request } from "../requests/get.js";

const interface_action = new Composer();

//  START COMMAND /START
interface_action.start(
  helper.catchAsync(async (ctx, next) => {
    const check = ctx.session.user.active;
    const channel_check = await helper.channelStatus(ctx);
    if (channel_check === false) {
      return helper.sendButtons(ctx, ctx.chat.id, context.channel_text, [
        [{ text: "JOIN CHANNEL", url: process.env.CHANNEL_LINK }],
        [{ text: "NEXT", callback_data: "channel_pass" }],
      ]);
    }
    await startHandler({
      ctx,
      check,
    });
  })
);

// CHANNEL MIDDLEWARE PASS
interface_action.action(
  "channel_pass",
  helper.catchAsync(async (ctx, next) => {
    await helper.ansQdel(ctx);
    let check = ctx.session.user.active;
    if (!check) {
      const user = await getUser(ctx.chat.id);
      check = user.active;
    }
    await startHandler({
      ctx,
      check,
    });
  })
);
// MAIN MENU INTERFACE
interface_action.action(
  "main_menu",
  helper.catchAsync(async (ctx, next) => {
    if ("data" in ctx.callbackQuery) {
      if (ctx.scene) ctx.scene.leave();
      if (!ctx.session.user.active)
        return await helper.ansQ(ctx, "kindly, create your account....");
      let text = "<code>select your option below &#x200D</code>";
      const buttons = [];
      buttons.push(
        [Markup.button.callback("BUY UTILITY", `proceed`)],
        [
          Markup.button.callback("PROFILE", `profile_alert`),
          Markup.button.callback("FUND WALLET", "fund_wallet"),
        ],
        [Markup.button.callback("PURCHASE HISTORY", `history`)],
        [Markup.button.callback("HOME PAGE", "homepage")]
      );

      if (ctx.session.user.active)
        buttons.push([Markup.button.callback("RESET PASSWORD", "reset-key")]);

      await helper.sendEditMessageButtons(ctx, text, buttons);
    }
  })
);

// SET UNIQUE KEY INTERFACE
interface_action.action(
  /(set-key|reset-key)/,
  helper.catchAsync(async (ctx, next) => {
    await helper.ansQdel(ctx);
    if ("data" in ctx.callbackQuery) {
      ctx.match[0] === "set-key"
        ? ctx.scene.enter("set-key")
        : ctx.scene.enter("reset-key");
    }
  })
);

// PROCEED TO BUYING OF UTILITIES
interface_action.action(
  "proceed",
  helper.catchAsync(async (ctx, next) => {
    if ("data" in ctx.callbackQuery) {
      const buttons = [
        [
          { text: "AIRTIME", callback_data: "airtime" },
          { text: "DATA", callback_data: "data" },
        ],
        [{ text: "MAIN MENU", callback_data: "main_menu" }],
      ];
      await helper.sendEditMessageButtons(
        ctx,
        "<pre>select your option</pre>",
        buttons
      );
    }
  })
);

// PROFILE ALERT INTERFACE
interface_action.action(
  "profile_alert",
  helper.catchAsync(async (ctx, next) => {
    const user_data = await getUser(ctx.chat.id);
    if (!user_data)
      return helper.ansQ(
        ctx,
        "Your Account is no longer active, contact the admin.."
      );
    if ("data" in ctx.callbackQuery) {
      let text = ` <b>USER ACCOUNT INFORMATION</b>\n
<pre>profile-code</pre> : <b>${user_data.id}</b>
<pre>referral-count</pre> : <b>${user_data.count}</b>
<pre>referral-link</pre> : <code>https://t.me/${ctx.botInfo.username}?start=${
        ctx.chat.id
      }</code>
<pre>email</pre> : <b>${maskedCharacters(user_data.email, -10) || "NOT SET"}</b>
<pre>phone-number</pre> : <b>${
        maskedCharacters(user_data.phone_number, -6) || "NOT SET"
      }</b>
<pre>wallet-balance</pre> : <b>#${user_data.wallet}.00</b>
<pre>total-wallet-funded</pre> : <b>#${user_data.total_wallet}.00</b>

<b>BANK ACCOUNT DETAILS</b>\n
${userAccountText(user_data)}
      `;
      const buttons = [[{ text: "MAIN MENU", callback_data: "main_menu" }]];
      if (user_data.roles === "admin")
        buttons.push([{ text: "CHECK STATUS", callback_data: "check_status" }]);
      await ctx.persistentChatAction("typing", async () => {
        await helper.sendEditMessageButtons(ctx, `${text}`, buttons);
      });

      ctx.session.user = user_data;
    }
  })
);

// HOME-PAGE INTERFACE
interface_action.action(
  "homepage",
  helper.catchAsync(async (ctx, next) => {
    if ("data" in ctx.callbackQuery) {
      if (ctx.scene) ctx.scene.leave();
      await helper.ansQ(ctx);
      const check = ctx.session.user.active;
      return startHandler({ ctx, check });
    }
  })
);

// HELP MESSAGE
interface_action.action(
  "help",
  helper.catchAsync(async (ctx, next) => {
    if ("data" in ctx.callbackQuery) {
      const text = `Welcome to <b>${process.env.BOT_NAME.toUpperCase()}</b>, a light-weight bot designed to simplify the purchase of utilities.\n\n<b>DETAILS ABOUT ${process.env.BOT_NAME.toUpperCase()}</b>\n\n1️⃣ Buttons are used to navigate within the bot chat.\n2️⃣ Upon creation of account, each users are assigned a unique account number inorder to fund their wallets. \n3️⃣ <b>@utilsbuybot</b> uses two models (<b>LOADED</b> and <b>RE-LOADED</b>), users are able to switch between models inorder to make a purchase, To switch models click on the "SETTINGS" button in the hompage, then tap on the model button to make the switch.\n4️⃣ Each user are assigned a unique referral link, To get your link - click on "PROFILE" button in the main menu, per 5 referrals - the user gets #100 wallet upgrade.`;
      await helper.sendEditMessageButtons(ctx, text, [
        [{ text: "MESSAGE CUSTOMER CARE", url: process.env.ADMIN_LINK }],
        [{ text: "MAIN MENU", callback_data: "main_menu" }],
      ]);
    }
  })
);

// FUND WALLET
interface_action.action(
  "fund_wallet",
  helper.catchAsync(async (ctx, next) => {
    if ("data" in ctx.callbackQuery) {
      const text = `
<b>AUTOMATED WALLET FUNDING</b> 
<pre>FUND YOUR ACCOUNT BY TRANSFERRING THE AMOUNT TO YOUR UNIQUE ACCOUNT NUMBER</pre>

<b>NOTE</b>: <code>processing fee of #30 is attached.</code>

${userAccountText(ctx.session.user)}
`;
      await helper.sendEditMessageButtons(ctx, text, [
        [{ text: "MESSAGE CUSTOMER CARE", url: process.env.ADMIN_LINK }],
        [{ text: "MAIN MENU", callback_data: "main_menu" }],
      ]);
    }
  })
);

// CHECK-STATUS
interface_action.action(
  "check_status",
  helper.catchAsync(async (ctx, next) => {
    if ("data" in ctx.callbackQuery) {
      await request(ctx);
    }
  })
);

// RE-SEND (TRY-AGAIN) FOR DATA OR AIRTIME (SWITCHING MODEL AUTOMATICALLY)
interface_action.action(
  "send_request",
  helper.catchAsync(async (ctx, next) => {
    if ("data" in ctx.callbackQuery) {
      await helper.ansQ(ctx, "processing your request ....");
      const supported = ["LOADED", "RE-LOADED"];
      const current = ctx.session.MODEL;
      const next =
        supported[(supported.indexOf(current) + 1) % supported.length];
      ctx.session.MODEL = next;
      await helper.del(ctx);
      await change_host(ctx);

      if (ctx.session.plan_amount) {
        ctx.session.MODEL === "LOADED"
          ? (ctx.session.plan_amount = ctx.session.planDetails.plan_amount_1)
          : (ctx.session.plan_amount = ctx.session.planDetails.plan_amount_2);
      }
      await ctx.persistentChatAction("typing", async () => {
        await loadRequest(ctx);
      });
    }
  })
);

export default interface_action;
