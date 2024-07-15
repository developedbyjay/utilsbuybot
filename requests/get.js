import redirect from "follow-redirects";
import helper from "../utils/helper-base.js";

const https = redirect.https;

export const request = async (ctx) => {
  const api1_options = {
    method: "GET",
    hostname: "arisedataapi.com.ng",
    path: "/api/user",
    headers: {
      Authorization: `Token ${process.env.API_1}`,
      "Content-Type": "application/json",
    },
    maxRedirects: 20,
  };

  const api2_options = {
    method: "GET",
    hostname: "benzoni.ng",
    path: `/api/v2/others/get_account_balance.php?api_key=${process.env.API_2}`,
    headers: {},
    maxRedirects: 20,
  };

  const requests = [sendRequest(api1_options), sendRequest(api2_options)];

  function sendRequest(options) {
    return new Promise((resolve, reject) => {
      const req = https.request(options, function (res) {
        const chunks = [];

        res.on("data", function (chunk) {
          chunks.push(chunk);
        });

        res.on("end", async function (chunk) {
          resolve(chunks);
        });

        res.on("error", function (error) {
          reject(error);
        });
      });
      req.end();
    });
  }

  try {
    const results = await Promise.all(requests);
    let buffer_msg = [];
    let text;
    for (let i = 0; i < results.length; i++) {
      buffer_msg.push(JSON.parse(Buffer.concat(results[i])));
    }
    const chk = [...buffer_msg];
    const [bank_1, bank_2] = chk[0].user.bank_accounts.accounts;
    text = `
<b>ARISE - TELECOMMUNICATIONS DETAILS</b>
  
  <code>WALLET BALANCE</code> : <b>#${chk[0].user.wallet_balance}</b>
  
  <code>BANK DETAILS</code>
  
  <code>1 -- ${bank_1.bankName}</code>
  <code>${bank_1.accountNumber}</code>
  
  <code>2 -- ${bank_2.bankName}</code>
  <code>${bank_2.accountNumber}</code>
  

<b>BENZONI - TELECOMMUNICATIONS DETAILS</b>
  
  <code>WALLET BALANCE</code>: <b>#${chk[1].wallet}</b>
  <code>CASHBACK</code>: <b>#${chk[1].cashback}</b>
  `;
    await helper.sendEditMessageButtons(ctx, `${text}`, [
      [{ text: "HOME PAGE", callback_data: "homepage" }],
    ]);
  } catch (err) {
    console.error(err);
  }
};
