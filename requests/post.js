import redirect from "follow-redirects";
import helper from "../utils/helper-base.js";
import { getUser, createHistory, useDate } from "../utils/base-help.js";

const https = redirect.https;

export const request = async (ctx, req_path, msg, money, hostname) => {
  let path;
  let headers = {};
  if (hostname === "arisedataapi.com.ng") {
    path = `/api/${msg}/`;
    headers = {
      Authorization: `Token ${process.env.API_1}`,
      "Content-Type": "application/json",
    };
  } else {
    path = req_path;
  }

  const options = {
    method: "POST",
    hostname,
    path,
    headers,
    maxRedirects: 20,
  };

  // STORE THE MSG IN A SESSION FOR RE-USABILITY
  ctx.session.msg = msg;

  const req = https.request(options, function (res) {
    const chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", async function (chunk) {
      let body = Buffer.concat(chunks);

      const payment = JSON.parse(body.toString());
      // IF THERE IS AN ERROR --- DO THIS

      if (
        payment.error ||
        payment.Status === "failed" ||
        payment.text_status === "FAILED"
      ) {
        if (!ctx.session.count) ctx.session.count = 0;

        const text = `
connection timeout, 
click 'Try Again' to switch MODEL and then send the requests simultaneously.

retries: ${ctx.session.count}
MODEL: <b>${ctx.session.MODEL}</b>
`;
        let channel_msg = `
<code>Error FROM ${hostname} api </code>
<code>Initialized by user with the ID</code> <b>${ctx.chat.id}</b>

<code>${JSON.stringify(payment)}</code>

        `;

        await helper.sendMessage(
          ctx,
          `${process.env.ERRORS_CHANNEL_ID}`,
          `${channel_msg}`
        );
        await helper.sendButtons(ctx, ctx.chat.id, `<code>${text}</code>`, [
          [
            {
              text: `TRY-AGAIN: ${ctx.session.count}`,
              callback_data: "send_request",
            },
          ],
          [
            { text: "HOME PAGE", callback_data: "homepage" },
            { text: "MAIN MENU", callback_data: "main_menu" },
          ],
          [{ text: "MESSAGE ADMIN", url: process.env.ADMIN_LINK }],
        ]);

        // UPDATE COUNTS
        ctx.session.count++;
        // SET STATUS TO FAILED
        ctx.session.status = "failed";
        // CREATE THE PURCHASE DOCUMENT
        if (ctx.session.count <= 1) await createHistory(ctx);

        return;
      }
      // NO ERROR --- DO THIS
      ctx.session.count = 0;
      const user = await getUser(ctx.chat.id);

      user.wallet -= money;
      ctx.session.user = await user.save();

      let text;
      if (msg === "data") {
        text = `
        <b>TRANSCATION SUCCESSFUL ✨✨</b>

<code>TRANSCATION ID:</code> <b>${payment.id || payment.data.recharge_id}</b>
<code>NETWORK: </code><b>${ctx.session.network_name}</b>
<code>MOBILE-NUMBER : </code><b>${ctx.session.mobile}</b>
<code>PLAN:</code> <b>${ctx.session.plan}</b>
<code>AMOUNT: </code><b>#${ctx.session.plan_amount}</b>
<code>STATUS: </code><b>${payment.Status || payment.data.text_status}</b> 
<code>WALLET BALANCE: </code><b>#${ctx.session.user.wallet}</b>
<code>MODEL: ${ctx.session.MODEL}</code>
<code>DATE: </code><b>${useDate()}</b>
`;
      } else if (msg === "topup") {
        text = `
        <b>TRANSCATION SUCCESSFUL ✨✨</b>
        
<code>TRANSCATION ID:</code> <b>${payment.id || payment.data.recharge_id}</b>
<code>NETWORK:</code> <b>${ctx.session.network_name}</b>
<code>MOBILE-NUMBER:</code> <b>${ctx.session.mobile}</b>
<code>AMOUNT: </code> <b>#${ctx.session.creditAmount}</b>
<code>STATUS:</code> <b>${payment.Status || payment.data.text_status}</b>   
<code>WALLET BALANCE:</code> <b>#${ctx.session.user.wallet}.00</b>
<code>MODEL: ${ctx.session.MODEL}</code>
<code>DATE: </code><b>${useDate()}</b>
`;
      }
      const btn = [
        [{ text: "BUY MORE", callback_data: "proceed" }],
        [
          { text: "HOME PAGE", callback_data: "homepage" },
          { text: "MAIN MENU", callback_data: "main_menu" },
        ],
      ];

      let channel_msg;

      if (msg === "data") {
        channel_msg = `
<code>USER WITH ID ${ctx.chat.id} PURCHASED ${msg.toUpperCase()}</code>
<code>NETWORK : ${ctx.session.network_name}</code>
<code>TRANSCATION ID : ${payment.id || payment.data.recharge_id}</code>
<code>MOBILE NUMBER : ${ctx.session.mobile}</code>
<code>PLAN: ${ctx.session.plan}</code>
<code>AMOUNT: #${ctx.session.plan_amount}</code>
<code>DIRECT-AMOUNT: ${
          payment.plan_amount || payment.data.amount_charged || "not set"
        } </code>
<code>BALANCE-REMAINING: ${
          payment.balance_after || payment.data.after_balance || "not set"
        } </code>
<code>STATUS: ${payment.Status || payment.data.text_status}</code>
<code>PROVIDER: ${hostname}</code>
<code>MODEL: ${ctx.session.MODEL}</code>
<code>WALLET BALANCE</code>: <b>#${ctx.session.user.wallet}</b>
<code>DATE</code>: <b>${useDate()}</b>
    `;
      } else if (msg === "topup") {
        channel_msg = `
<code>USER WITH THE ID ${ctx.chat.id} BOUGHT ${msg.toUpperCase()}</code>   
<code>NETWORK : ${ctx.session.network_name}</code>
<code>MOBILE NUMBER : ${ctx.session.mobile}</code>
<code>AMOUNT : #${ctx.session.creditAmount}</code>
<code>DIRECT-AMOUNT: ${
          payment.paid_amount || payment.data.amount_charged || "not set"
        } </code>
<code>BALANCE-REMAINING: ${
          payment.balance_after || payment.data.after_balance || "not set"
        } </code>
<code>STATUS: ${payment.Status || payment.data.text_status}</code>
<code>PROVIDER: ${hostname}</code>
<code>MODEL: ${ctx.session.MODEL}</code>
<code>WALLET BALANCE</code>: <b>#${ctx.session.user.wallet}</b>
<code>DATE</code>: <b>${useDate()}</b>
            `;
      }

      // SEND MESSAGE TO USER
      await helper.sendButtons(ctx, ctx.chat.id, `${text}`, btn);
      // SEND MESSAGE TO CHANNEL
      await helper.sendMessage(
        ctx,
        `${process.env.PURCHASE_CHANNEL_ID}`,
        `${channel_msg}`
      );
      await helper.sendMessage(
        ctx,
        `${process.env.PURCHASE_CHANNEL_ID}`,
        JSON.stringify(payment)
      );
      ctx.session.status = "successful";
      // CREATE THE PURCHASE DOCUMENT
      await createHistory(ctx);
    });
  });
  req.write(req_path);
  req.end();
};
