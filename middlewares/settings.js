import { Composer } from "telegraf";
import helper from "../utils/helper-base.js";
import { set, get } from "../requests/cache.js";
import vPay from "../requests/services.js";

const settings = new Composer();

const settingsMsg = (ctx) => {
  const model_name = {
    model_1: "LOADED",
    model_2: "RE-LOADED",
  };
  return ` 
<b>CHOOSE BOT MODEL:</b>

You can change the bot model by clicking on the button below.\n
<b>${model_name.model_1}</b> : Delivers Faster but might not be available if overcrowded. \n
<b>${model_name.model_2}</b> : Readily available but delivery may be slower due to connection issues.
    
Model is currently set to <b>${ctx.session.MODEL}</b>.
    `;
};

const settingsKeyboard = (ctx) => {
  return [
    [
      {
        text: `MODEL: ${ctx.session.MODEL}`,
        callback_data: "settings:api_change",
      },
    ],
    [
      {
        text: `HOME PAGE`,
        callback_data: "homepage",
      },
      {
        text: `MAIN MENU`,
        callback_data: "main_menu",
      },
    ],
    
  ];
};
settings.action(
  "settings",
  helper.catchAsync(async (ctx, next) => {
    if (ctx.session.user.active === false)
      return await helper.ansQ(ctx, "Kindly, create your account.. ");
    await helper.sendEditMessageButtons(
      ctx,
      settingsMsg(ctx),
      settingsKeyboard(ctx)
    );
  })
);

settings.action(
  "settings:api_change",
  helper.catchAsync(async (ctx) => {
    const supported = ["LOADED", "RE-LOADED"];
    const current = ctx.session.MODEL;
    const next = supported[(supported.indexOf(current) + 1) % supported.length];
    ctx.session.MODEL = next;
    await helper.ansQ(ctx, "processing...");
    await helper.sendEditMessageButtons(
      ctx,
      settingsMsg(ctx),
      settingsKeyboard(ctx)
    );
  })
);

settings.action(
  "update_reserve",
  helper.catchAsync(async (ctx, next) => {
    if (ctx.session.user.active === false)
      return await helper.ansQ(ctx, "Kindly set your password...");
    if ("data" in ctx.callbackQuery) {
      if (ctx.session.user.account_number.length > 1)
        return await helper.ansQ(ctx, "Account Number Updated....");
      await helper.ansQ(ctx, "UPDATING ACCOUNT NUMBER please wait...");
      const service = new vPay();
      let token = await get("AccessToken");
      const body = {
        vfdvirtualaccount: `${ctx.session.user.account_number[0].nuban}`,
        banks: ["000023"],
      };
      if (!token) {
        token = await service.genToken(ctx.chat.id);
        await set("AccessToken", token, 300);
      }

      if (token === undefined)
        return await helper_scene.exit(
          ctx,
          `<b>An Error Occcured :)</b>\n<code>Click 'Main-Menu' to try again</code>`
        );

      const text = await helper.reply(
        ctx,
        `<code>Updating Account Number.\nThis might take a few seconds...</code>`
      );

      helper.setTimer(ctx, text.message_id, 10000);
      await ctx.persistentChatAction("typing", async () => {
        await service.updateUser(body, token, ctx.chat.id);
      });
    }
  })
);
export default settings;
