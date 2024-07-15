import axios from "axios";
import { Composer } from "telegraf";
import { startHandler } from "../helpers/handler.js";
import helper from "../utils/helper-base.js";

const history = new Composer();

const pageSize = 10;
let currentPage = 1;

history.action(
  /(data_history|airtime_history)/,
  helper.catchAsync(async (ctx, next) => {
    currentPage = 1;
    let txt;
    if (ctx.match[0] === "data_history") {
      txt = "data";
    } else {
      txt = "airtime";
    }
    const history = await axios.get(
      `${process.env.DOMAIN}/api/v1/history?id=${ctx.chat.id}&type=${txt}&sortBy=true`,
      {
        headers: {
          Authorization: `Bearer ${ctx.session.user.token}`,
        },
      }
    );
    const { data } = history.data.data;
    if (data.length === 0) {
      const check = await helper.channelStatus(ctx);
      helper.ansQ(ctx, "purchase history is currently empty");
      return startHandler({ ctx, check });
    }
    ctx.session.check_history = data;

    await displayData(ctx, currentPage);
  })
);

history.action(
  /(data|airtime)/,
  helper.catchAsync(async (ctx, next) => {
    helper.ansQdel(ctx);
    if (!ctx.session.user.active) return;
    if (ctx.match[0] === "data") return ctx.scene.enter("data");
    return ctx.scene.enter("airtime");
  })
);

history.action(
  "history",
  helper.catchAsync(async (ctx, next) => {
    if (ctx.session.user.active === false)
      return await helper.ansQ(ctx, "Kindly set your password...");
    await helper.ansQ(ctx, "processing...");
    const text = "<code>select your history option</code>";
    const buttons = [
      [
        { text: "AIRTIME", callback_data: "airtime_history" },
        { text: "DATA", callback_data: "data_history" },
      ],
      [{ text: "MAIN MENU", callback_data: "main_menu" }],
    ];
    await ctx.persistentChatAction("typing", async () => {
      await helper.sendEditMessageButtons(ctx, `${text}`, buttons);
    });
  })
);

history.action(
  /(prev_his|next_his)/,
  helper.catchAsync(async (ctx) => {
    helper.ansQ(ctx, "processing...");
    if (ctx.match[0] === "next_his") {
      currentPage++;
    } else {
      currentPage--;
    }
    await displayData(ctx, currentPage);
  })
);

async function displayData(ctx, page) {
  if (!ctx.session.check_history) {
    const check = await helper.channelStatus(ctx);
    return startHandler({ ctx, check });
  }
  const totalPages = Math.ceil(ctx.session.check_history.length / pageSize);

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageData = ctx.session.check_history.slice(startIndex, endIndex);

  const keyboardButton = [];
  let text = `<b>TOTAL RESULTS : ${ctx.session.check_history.length}</b>\n\n<b>DISPLAYING PAGE-${page} OF ${totalPages}</b>\n`;
  pageData.forEach((el, i) => {
    const chk = parseFloat(el.request);
    if (chk) el.request = `#${el.request}`;
    text += `
<pre>${++i}</pre>
   <code>NETWORK: ${el.network.toUpperCase()}</code>
   <code>UTILITY: ${el.type.toUpperCase()}</code>
   <code>REQUEST: ${el.request.toUpperCase()}</code>
   <code>MOBILE : ${el.phoneNumber}</code>
   <code>STATUS:  ${el.status.toUpperCase()}</code>
   <code>DATE-OF-PURCHASE: ${el.date_created.toUpperCase()}</code>
  `;
  });
  if (currentPage > 1)
    keyboardButton.push({ text: "<<", callback_data: "prev_his" });
  if (currentPage < totalPages)
    keyboardButton.push({ text: ">>", callback_data: "next_his" });

  await ctx.persistentChatAction("typing", async () => {
    await helper.sendEditMessageButtons(ctx, text, [
      keyboardButton,
      [{ text: "HISTORY", callback_data: "history" }],
      [{ text: "HOME PAGE", callback_data: "homepage" }],
    ]);
  });
}

export default history;
