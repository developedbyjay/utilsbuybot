import { Composer } from "telegraf";
import User from "../models/user.js";
import context from "../helpers/config.js";
import helper from "../utils/helper-base.js";
import { createSendToken, getUser } from "../utils/base-help.js";

const user_save = new Composer();
user_save.use(
  helper.catchAsync(async (ctx, next) => {
    // If message is from the channel , don't respond
    if (ctx.chat.type === "channel") return;
    //  check if user is a member of the channel
    const channel_check = await helper.channelStatus(ctx);
    if (ctx.session.user && (channel_check === true)) return next();

    if(ctx.session.user && (channel_check === false)){
      await helper.del(ctx)
      return helper.sendButtons(ctx, ctx.chat.id, context.channel_text, [
        [{ text: "JOIN CHANNEL", url: process.env.CHANNEL_LINK }],
        [{ text: "NEXT", callback_data: "channel_pass" }],
      ]);
    }
    // Get user from database
    const user = await getUser(ctx.chat.id);

    // SET DEFAULT BOT SESSION SETTINGS
    ctx.session.MODEL = "LOADED";

    if (ctx.from) {
      // If user exists in database , store user in session then return next()
      if (user && (channel_check === true)) {
        ctx.session.user = user;
        return next();
      }
      
      if(user && (channel_check === false)){
        await helper.del(ctx)
        return helper.sendButtons(ctx, ctx.chat.id, context.channel_text, [
          [{ text: "JOIN CHANNEL", url: process.env.CHANNEL_LINK }],
          [{ text: "NEXT", callback_data: "channel_pass" }],
        ]);
      }
      // check if the user start the bot by using a referral link
      if (ctx.message.text.startsWith("/start") && !user) {
        // store the referral ID
        let msg = ctx.message.text.slice(7);
        let ref_id;
        // if the referral ID is not included,use the ADMIN referral ID
        if (ctx.message.text.length === 6) {
          ref_id = process.env.OWNER;
        } else {
          ref_id = msg;
        }
        // SAVE THE USER INTO THE DATABASE
        const saved_user = await User.create({
          referral: +ref_id,
          id: +ctx.from.id,
        });
        saved_user.token = createSendToken(saved_user);
        ctx.session.user = await saved_user.save();
        if(channel_check === false){
          return helper.sendButtons(ctx, ctx.chat.id, context.channel_text, [
            [{ text: "JOIN CHANNEL", url: process.env.CHANNEL_LINK }],
            [{ text: "NEXT", callback_data: "channel_pass" }],
          ]);
        }
      }
    }
  })
);

export default user_save;
