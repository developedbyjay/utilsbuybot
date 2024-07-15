import dotenv from "dotenv";

dotenv.config({ path: "config.env" });

const context = {
  // INITIAL BOT MESSAGE TO USER
  initial_text: `<b>👋 WELCOME TO ${process.env.BOT_NAME.toUpperCase()}! 🌟</b>

  💡 Need to top up your mobile data or purchase airtimes? You're in the right place! ${
    process.env.BOT_NAME
  } is here to make your utility purchase easier!
  
 
  1️⃣ click on <b>CREATE ACCOUNT</b> button
  2️⃣ click on <b>MAIN-MENU</b> button.
  3️⃣ click on <b>FUND WALLET</b> button to fund your wallet.
  4️⃣ click on <b>BUY UTILITY</b> to purchase utilities.
  
  🔒 <code>Your safety is our top priority, so you can trust that all transactions are secured and your personal information is protected.</code>
 `,

  channel_text: `<pre>To get access to the bot features,</pre><b>kindly join the channel to get fast access to discounts, promos, and accessibility to customer care services.</b>`,
};

export default context;
