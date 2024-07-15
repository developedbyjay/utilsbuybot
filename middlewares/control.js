import { Composer } from "telegraf";
import helper from "../utils/helper-base.js";
import { getUser, userAccountText } from "../utils/base-help.js";
import User from "../models/user.js";

const control = new Composer();

async function checkUserExist(ctx, uuid) {
  if (!uuid) return;
  const user = await getUser(+uuid);
  if (!user) {
    helper.del(ctx);
    const text = await helper.reply(
      ctx,
      "<code>User is currently not available</code>"
    );
    helper.setTimer(ctx, text.message_id, 3000);
    return;
  }
  return user;
}

// CREDIT/DEBIT USERS WALLET
control.command(
  "credit",
  helper.catchAsync(async (ctx, next) => {
    if ((await checkUserExist(ctx, ctx.chat.id)).roles !== "admin") return;
    let text;
    const [cmd, uuid, amount] = ctx.message.text.split(" ");
    const user = await checkUserExist(ctx, uuid);
    if (!user || !amount) return;
    user.wallet += +amount;
    user.total_wallet += +amount;
    await user.save();
    text = await helper.reply(ctx, "<code>success</code>");
    if (amount.startsWith("-")) return;
    text = `
    <code>Your wallet has been creditted with</code> <b>#${amount}</b>
    `;
    await helper.sendButtons(ctx, uuid, text, [
      [{ text: "BUY", callback_data: "proceed" }],
      [{ text: "MAIN MENU", callback_data: "main_menu" }],
    ]);
    return;
  })
);

// CHECK USERS PROFILE
control.command(
  "profile",
  helper.catchAsync(async (ctx, next) => {
    if ((await checkUserExist(ctx, ctx.chat.id)).roles !== "admin") return;
    const [cmd, uuid] = ctx.message.text.split(" ");
    const user = await checkUserExist(ctx, uuid);
    if (!user) return;
    const {
      id,
      wallet,
      total_wallet,
      email,
      phone_number,
      unique_key,
      count,
      active,
      token,
    } = user;
    const text = ` <b>USER ACCOUNT INFORMATION</b>\n
<code>profile-code</code> : <b>${id}</b>
<code>unique-key</code> : <b>${unique_key}</b>
<code>referral-count</code> : <b>${count}</b>
<code>email</code> : <b>${email || "NOT SET"}</b>
<code>phone-number</code> : <b>${phone_number || "NOT SET"}</b>
<code>wallet-balance</code> : <b>#${wallet}.00</b>
<code>total-wallet-funded</code> : <b>#${total_wallet}.00</b>
<code>status</code> : ${active === true ? "🟢" : "🟡"}
<code>token</code> : <code>${token}</code> 

<b>BANK DETAILS</b>\n
${userAccountText(user)}
      `;

    await helper.reply(ctx, text);
    helper.setTimer(ctx, text.message_id, 30000);
    return;
  })
);

// MESSAGE USER
control.hears(
  /\/message/,
  helper.catchAsync(async (ctx, next) => {
    if(ctx.session.user.roles !== 'admin') return;
    const msg = ctx.message.text.match(/\/message (\d+) (.*)/);
    if (!msg) return;
    const user = await checkUserExist(ctx, msg[1]);
    if (!user) return;
    const text = `
    <b>MESSAGE FROM ADMIN</b> 

<code>${msg[2]}</code>
    `;
    await helper.reply(ctx, `<code>Message Sent to : ${msg[1]}</code>`);
    await helper.sendButtons(ctx, user.id, text, [
      [{ text: "REPLY", url: process.env.ADMIN_LINK }],
    ]);
  })
);

// UPDATE USER STATUS
control.command(
  "status",
  helper.catchAsync(async (ctx, next) => {
    if ((await checkUserExist(ctx, ctx.chat.id)).roles !== "admin") return;
    let text;
    const [cmd, uuid, msg] = ctx.message.text.split(" ");
    const user_one = await checkUserExist(ctx, uuid);
    if (!user_one) return;
    if (msg === "remove") {
      await helper.reply(ctx, "<code>User deleted</code>");
      return await User.findByIdAndDelete(user_one._id);
    }
    user_one.roles = msg;
    await user_one.save();
    text = await helper.reply(ctx, "success");
    helper.setTimer(ctx, text.message_id, 10000);
    return;
  })
);

export default control;
