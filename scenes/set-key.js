import { Scenes } from "telegraf";
import helper from "../utils/helper-base.js";
import helper_scene from "../utils/helper-scene.js";
import { set, get } from "../requests/cache.js";
import { getUser, return_back_func } from "../utils/base-help.js";
import vPay from "../requests/services.js";

const WizardScene = Scenes.WizardScene;

const uniquekey_scene = new WizardScene(
  "set-key",
  helper.catchAsync(async (ctx, next) => {
    await helper_scene.askofUniqueKey(ctx);
  }),
  helper.catchAsync(async (ctx, next) => {
    await helper_scene.askofGmail(ctx);
  }),
  helper.catchAsync(async (ctx, next) => {
    await helper_scene.askofPhoneNumber(ctx);
  }),
  helper.catchAsync(async (ctx, next) => {
    await helper_scene.generateAccountNumber(ctx);
  })
);

uniquekey_scene.action(
  "return_back",
  helper.catchAsync(async (ctx, next) => {
    await return_back_func(
      ctx,
      `<b>PROVIDE YOUR PHONE NUMBER WITHOUT (+234)</b>`,
      [[{text:'cancel'},{ text: "return" }]],
      3
    );
  })
);


uniquekey_scene.action(
  "generate_account",
  helper.catchAsync(async (ctx, next) => {
    await helper.ansQ(ctx, "processing...");
    await helper.removeKeyboard(ctx, ctx.chat.id, "<i>processing...</i>", 0);
    const msg_text = await helper.reply(
      ctx,
      "<code>Generating Account Number...\nThis process might take a few seconds...</code>"
    );

    ctx.chat.id === +process.env.OWNER && (ctx.session.user.roles = "admin");
    ctx.session.user.unique_key = ctx.session.set_uniquekey;
    ctx.session.user.active = true;
    ctx.session.user.phone_number = ctx.session.mobile;
    ctx.session.user.email = ctx.session.user_gmail;

    let body = {
      email: `${ctx.session.user_gmail}`,
      phone: `${ctx.session.mobile}`,
      contactfirstname: `UTILS-${ctx.chat.id}`,
      contactlastname: `UTILS`,
    };

    const service = new vPay();
    let token = await get("AccessToken");

    if (!token) {
      token = await service.genToken(ctx.chat.id);
      await set("AccessToken", token, 300);
    }

    if (token === undefined) {
      await ctx.scene.leave();
      return await helper_scene.exit(
        ctx,
        `<b>An Error Occcured :)</b>\n<code>Click 'Main-Menu' to try again</code>`
      );
    }
    const created_user = await service.reserveAccount(body, token, ctx.chat.id);

    const user_details = await service.getUser(
      created_user.id,
      token,
      ctx.chat.id
    );

    ctx.session.user.account_name = user_details.contactfirstname.toUpperCase();
    ctx.session.user.account_number = user_details.virtualaccounts;
    await ctx.session.user.save();

    await helper.del(ctx, msg_text.message_id);

    let acct_text = "<b>BANK ACCOUNT DETAILS</b>\n<code>Fund your wallet by transferring money to your unique account number.</code> \n\n";
    ctx.session.user.account_number.forEach((el) => {
      acct_text += `BANK-NAME: <b>${el.bank.toUpperCase()}</b>\nACCOUNT-NUMBER: <b>${
        el.nuban
      }</b>\nACCOUNT-NAME: <b>${ctx.session.user.account_name.replace(ctx.session.user.account_name,'UTILSBUYBOT')}</b>\n\n`;
    });

    await helper.sendEditMessageButtons(ctx, acct_text, [
      [{ text: "MAIN MENU", callback_data: "main_menu" }],
    ]);
    const user_ref = await getUser(ctx.session.user.referral);
    let text;
    if (user_ref) {
      user_ref.count += 1;
      if (user_ref.count === 5) {
        user_ref.wallet += 100;
        user_ref.count = 0;
        await user_ref.save();
        text = `<i> Hurray </i>, <b>You have been creditted with #100</b>`;
        await helper.sendMessage(ctx, user_ref.id, text);
      } else {
        await user_ref.save();
        text = `<i> Congratulation's, a user registered with your link,
      You have <b>${5 - user_ref.count}</b> more users to go.</i>`;
        await helper.sendMessage(ctx, user_ref.id, text);
      }
    }
    ctx.scene.leave();
  })
);

export default uniquekey_scene;
