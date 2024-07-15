import axios from "axios";
import { Composer } from "telegraf";
import { AsciiTable3, AlignmentEnum } from "ascii-table3";
import helper from "../utils/helper-base.js";
import { startHandler } from "../helpers/handler.js";
import { set, get } from "../requests/cache.js";

const price_action = new Composer();

const pageSize = 10;
let currentPage = 1;

price_action.action(
  "check_price",
  helper.catchAsync(async (ctx) => {
    helper.ansQ(ctx, "processing....");
    // GET PLANS FROM CACHE
    let data = await get("all-data-plans");
    if (!data) {
      const plans = await axios.get(`${process.env.DOMAIN}/api/v1/dataplans`);
      data = plans.data.data.data;
      await set("all-data-plans", data);
    }
    ctx.session.check_price_dataplans = data.filter(
      (el) => el.isDisabled === false
    );;
    const text = "<pre>select your desired network</pre>\n<code>For a clearer view of the prices, kindly change your chat text settings to '13' or lesser</code>\n\nprices <b>(LOADED | RELOADED)</b>";
  
    const messageButtons = [
      [
        { text: "MTN", callback_data: "mtn" },
        { text: "GLO", callback_data: "glo" },
      ],
      [
        { text: "9-MOBILE", callback_data: "9mobile" },
        { text: "AIRTEL", callback_data: "airtel" },
      ],
      [{ text: "HOME PAGE", callback_data: "homepage" }],
    ];
    await ctx.persistentChatAction("typing", async () => {
      await helper.sendEditMessageButtons(ctx, `${text}`, messageButtons);
    });
  })
);

price_action.action(
  /(mtn|glo|airtel|9mobile)/,
  helper.catchAsync(async (ctx) => {
    currentPage = 1;
    await helper.ansQ(ctx, "processing....");
    ctx.session.plan_name = ctx.match[0];
    if (!ctx.session.check_price_dataplans) {
      await helper.ansQdel(ctx,'click on check prices in the HOMEPAGE...')
      const check = await helper.channelStatus(ctx)
      return startHandler({ctx, check});
    }
    ctx.session.sortedPlan = ctx.session.check_price_dataplans.filter(
      (el) => el.plan_network === ctx.match[0].toUpperCase()
    );
    await displayData(ctx, currentPage);
  })
);

price_action.action(
  /(prev|next)/,
  helper.catchAsync(async (ctx) => {
    helper.ansQ(ctx, "processing....");
    if (!ctx.session.sortedPlan || !ctx.session.check_price_dataplans) {
      await helper.ansQdel(ctx)
      const check = await helper.channelStatus(ctx)
      return startHandler({ctx, check});
    }
    if (ctx.match[0] === "next") {
      currentPage++;
    } else {
      currentPage--;
    }
    await displayData(ctx, currentPage);
  })
);

async function displayData(ctx, page) {
  const totalPages = Math.ceil(ctx.session.sortedPlan.length / pageSize);

  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageData = ctx.session.sortedPlan.slice(startIndex, endIndex);
  const buttons = [];
  const keyboardButton = [];

  pageData.forEach((el, i) => {
    buttons.push([
      el.name,
      `${el.plan_amount_1}|${el.plan_amount_2}`,
      el.month_validate,
    ]);
  });

  if (currentPage > 1)
    keyboardButton.push({ text: "<<", callback_data: "prev" });
  if (currentPage < totalPages)
    keyboardButton.push({ text: ">>", callback_data: "next" });

  const table = new AsciiTable3(`${ctx.session.plan_name.toUpperCase()} PLANS`)
    .setHeading("PLAN", "PRICE(#)", "VALIDITY")
    .setAlign(3, AlignmentEnum.CENTER)
    .addRowMatrix(buttons);
  table.setStyle("ramac");
  await ctx.persistentChatAction("typing", async () => {
    await helper.sendEditMessageButtons(ctx, `<pre>${table.toString()}</pre>`, [
      keyboardButton,
      [{ text: "PRICES", callback_data: "check_price" }],
      [{ text: "HOME PAGE", callback_data: "homepage" }],
    ]);
  });
}

export default price_action;
