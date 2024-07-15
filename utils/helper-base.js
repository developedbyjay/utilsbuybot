import { bot } from "../app.js";

class helper_base {
  // answerCallBackQuery
  async ansQ(ctx, message) {
    await ctx.answerCbQuery(message).catch((e) => console.log(e.message));
  }
  // DELETE MESSAGE using its ID
  async del(ctx, id) {
    if (id)
      return await ctx.deleteMessage(id).catch((e) => console.log(e.message));
    await ctx.deleteMessage().catch((e) => console.log(e.message));
  }
  // answerCallBackQuery And Delete Message
  async ansQdel(ctx, text) {
    if (!text) text = "";
    await this.ansQ(ctx, text);
    await this.del(ctx);
  }
  //  getChatMember --> TO CHECK IF A USER BELONGS TO THE CHANNEL OR NOT
  async channelStatus(ctx) {
    const user = await ctx.telegram.getChatMember(
      process.env.CHANNEL_ID,
      ctx.chat.id
    );
    if (user.status === "left") return false;
    return true;
  }
  // catchAsync --> TO AVOID WRITING TRY...CATCH ALL-OVER
  catchAsync(fn) {
    return (ctx, next) =>
      fn(ctx, next).catch(async (err) => {
        if (ctx) {
          await this.sendMessage(
            ctx,
            `${process.env.ERRORS_CHANNEL_ID}`,
            `Error from ${ctx.chat.id}\n <code>${err}</code>`
          );
          return;
        
          // this.del(ctx);
          // return this.exit(
          //   ctx,
          //   `<code>connection timeout,\n\n  Allow the bot to process the current requests before sending another.</code>\n\n<b>If message persists, click</b> /start <b>to relaunch the bot.</b>
          //   `
          // );
        }
        await this.sendMessage(bot, process.env.ERRORS_CHANNEL_ID, err.message);
      });
  }

  // CATCHING ASYNCRONOUS ERRORS GENERATED FROM CUSTOM API (EXPRESS ROUTES)
  catchAsyncApi(fn) {
    return (req, res, next) => fn(req, res, next).catch(next);
  }

  // SEND REPLY TO USER
  async reply(ctx, text) {
    return await ctx.replyWithHTML(text);
  }

  // SEND MESSAGE WITHOUT BUTTONS (USING ID)
  async sendMessage(ctx, uuid, text) {
    return await ctx.telegram.sendMessage(uuid, `<code>${text}</code>`, {
      parse_mode: "html",
    });
  }
  // SEND EDIT MESSAGE BUTTONS
  async sendEditMessageButtons(ctx, text, buttons) {
    return await ctx.editMessageText(text, {
      parse_mode: "html",
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }
  //  SEND KEYBOARD BUTTONS
  async sendKeyboards(ctx, uuid, text, buttons) {
    return await ctx.telegram.sendMessage(uuid, text, {
      parse_mode: "html",
      reply_markup: {
        keyboard: buttons,
        resize_keyboard: true,
      },
    });
  }
  // REMOVE CUSTOM KEYBOARD
  async removeKeyboard(ctx, uuid, text, time) {
    const replyText = await ctx.telegram.sendMessage(uuid, text, {
      parse_mode: "html",
      reply_markup: {
        remove_keyboard: true,
      },
    });
    if (!time) time = 0;
    this.setTimer(ctx, replyText.message_id, time);
  }

  // SEND INLINE BUTTONS
  async sendButtons(ctx, uuid, text, buttons) {
    await ctx.telegram.sendMessage(uuid, text, {
      parse_mode: "html",
      reply_markup: {
        inline_keyboard: buttons,
      },
    });
  }

  // SET TIMERS --> to delete message
  setTimer(ctx, id, time) {
    setTimeout(async () => {
      await this.del(ctx, id);
    }, time);
  }

  // SEND (X BY 2) MATRIX ALGORITHM
  async columnAlgo(data) {
    const keyboard = [];
    for (let i = 0; i < data.length - 1; i++) {
      if (i % 2 === 0) {
        keyboard.push([{ text: data[i].name }, { text: data[i + 1].name }]);
      }
    }
    if (data.length % 2 !== 0) {
      keyboard.push([{ text: data[data.length - 1].name }]);
    }
    keyboard.push([{ text: "return" }, { text: "cancel" }]);
    return keyboard;
  }
  // EXIT SCENE
  async exit(ctx, text) {
    if (!text)
      text = `<code>Welcome Back &#x200D</code>
<code>Select your option &#x200D</code>`;

    await this.removeKeyboard(ctx, ctx.chat.id, "<i>Bye</i>", 0);
    await ctx.scene.leave();
    const btn = [
      [{ text: "BUY", callback_data: "proceed" }],
      [
        { text: "MAIN MENU", callback_data: "main_menu" },
        { text: "HOME PAGE", callback_data: "homepage" },
      ],
      [{ text: "MESSAGE CUSTOMER CARE", url: process.env.ADMIN_LINK }],
    ];
    await this.sendButtons(ctx, ctx.chat.id, text, btn);
  }
  async exitCreateScene(ctx, text) {
    if (!text)
      text = `<code>Welcome Back &#x200D</code>
<code>Select your option &#x200D</code>`;

    await this.removeKeyboard(ctx, ctx.chat.id, "<i>Bye</i>", 0);
    await ctx.scene.leave();
    const btn = [
      [
        { text: "CREATE ACCOUNT", callback_data: "set-key" },
        { text: "HOME PAGE", callback_data: "homepage" },
      ],
      [{ text: "MESSAGE CUSTOMER CARE", url: process.env.ADMIN_LINK }],
    ];
    await this.sendButtons(ctx, ctx.chat.id, text, btn);
  }
}
const helper = new helper_base();
export default helper;
export { helper_base };
