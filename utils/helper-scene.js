import axios from "axios";
import User from "../models/user.js";
import { get, set } from "../requests/cache.js";
import { helper_base } from "./helper-base.js";

function setNetwork_ID(ctx, ID) {
  switch (ID) {
    case "MTN":
      ctx.session.network_id = 1;
      ctx.session.network_id_2 = "mtn_custom";
      break;
    case "GLO":
      ctx.session.network_id = 2;
      ctx.session.network_id_2 = "glo_custom";
      break;
    case "9MOBILE":
      ctx.session.network_id = 3;
      ctx.session.network_id_2 = "9mobile_custom";
      break;
    case "AIRTEL":
      ctx.session.network_id = 4;
      ctx.session.network_id_2 = "airtel_custom";
      break;
    default:
      console.log(`error from network_name 'switch case'`);
  }
}

function isValidPhoneNumber(phoneNum) {
  const validPrefixes = /^(080|090|091|070|081)/;
  const validLength = /^\d{11}$/;
  return (
    validLength.test(phoneNum.trim()) && validPrefixes.test(phoneNum.trim())
  );
}

class helper_scene extends helper_base {
  constructor() {
    super();
  }
  // SEND MESSAGE TO USER TO INPUT UNIQUE-KEY (1)
  async sendUniqueKeyMessage(ctx) {
    // RESETS THE SESSIONS
    ctx.session.count = 0;
    ctx.session.plan_amount = undefined;
    ctx.session.creditAmount = undefined;

    await this.reply(
      ctx,
      '<b>ENTER YOUR UNIQUE KEY</b> \n 1️⃣<code>click "return" to go back to the previous stage</code>\n 2️⃣<code>click "cancel" to exit</code>'
    );
    await this.sendKeyboards(ctx, ctx.chat.id, "🔒", [[{ text: "cancel" }]]);
    return ctx.wizard.next();
  }
  // VALIDATE UNIQUE KEY (2)
  async validateKey(ctx) {
    ctx.session.key = ctx.message.text || "";
    if (ctx.message.text === "return") return await this.del(ctx);
    if (ctx.message.text === "cancel") return await this.exit(ctx);
    this.del(ctx, ctx.message.text.message_id);
    // FOR UPDATING UNIQUE KEY
    if (ctx.session.updatekey)
      return await this.sendUpdateKeyMessage(ctx, ctx.session.key);
    // FOR MOBILE DATA and AIRTIME
    await this.sendNetworks(ctx, ctx.session.key);
  }
  // SEND PHONE-NUMBER MESSAGE (3)
  async sendPhoneNumberMessage(ctx) {
    ctx.session.network_name = ctx.message.text || "";
    if (ctx.message.text === "return") return await this.del(ctx);
    if (ctx.message.text === "cancel") return await this.exit(ctx);
    if (!["MTN", "GLO", "AIRTEL", "9MOBILE"].includes(ctx.message.text)) {
      const text = await this.reply(
        ctx,
        `<i><b>Invalid Input</b>, Kindly select the option below</i>`
      );
      this.setTimer(ctx, text.message_id, 3000);
      return;
    }
    // SET NETWORK ID
    setNetwork_ID(ctx, ctx.session.network_name);

    await this.reply(ctx, `<b>ENTER THE MOBILE NUMBER</b>`);
    this.sendKeyboards(ctx, ctx.chat.id, "📱", [
      [{ text: "return" }, { text: "cancel" }],
    ]);
    return ctx.wizard.next();
  }
  // VALIDATE PHONE-NUMBER (4)
  async validatePhoneNumber(ctx, text) {
    ctx.session.mobile = ctx.message.text || "";
    if (ctx.message.text === "return") {
      this.sendKeyboards(
        ctx,
        ctx.chat.id,
        "<b>SELECT YOUR NETWORK</b>",
        ctx.session.networkKeyboard
      );
      return ctx.wizard.selectStep(2);
    }
    if (ctx.message.text === "cancel") return await this.exit(ctx);
    if (!isValidPhoneNumber(ctx.session.mobile)) {
      await this.del(ctx);
      const text = await this.reply(
        ctx,
        "<code>Input a valid phone number</code>"
      );
      this.setTimer(ctx, text.message_id, 3000);
      return;
    }
    if (text === "data")
      return await this.sendDataRequestedPlans(ctx, ctx.session.network_name);
    return await this.sendAirtimeMessage(ctx);
  }
  // SEND AIRTIME MESSAGE
  async sendAirtimeMessage(ctx) {
    const buttons = [[{ text: "return" }, { text: "cancel" }]];
    await this.sendKeyboards(
      ctx,
      ctx.chat.id,
      "<b>ENTER THE AMOUNT</b>",
      buttons
    );
    return ctx.wizard.next();
  }
  // SEND UPDATE KEY MESSAGE
  async sendUpdateKeyMessage(ctx, userKey) {
    if (ctx.session.user.unique_key === userKey) {
      await this.reply(ctx, "🔓");
      await this.reply(ctx, "<b>ENTER NEW UNIQUE KEY</b>");
      return ctx.wizard.next();
    }
    const text = await this.reply(
      ctx,
      `<i>Incorrect Key, Try again or press <b>cancel</b> to exit</i>`
    );
    this.setTimer(ctx, text.message_id, 3000);
    return;
  }
  // VALIDATE RESET-KEY PROVIDED BY THE USER
  async updateUniqueKey(ctx) {
    ctx.session.new_key = ctx.message.text;
    if (ctx.message.text === "cancel") return await this.exit(ctx);
    await this.del(ctx, +ctx.message.message_id);
    if (ctx.session.new_key === ctx.session.user.unique_key) {
      const text = await this.reply(
        ctx,
        "<code>You entered the old key, Input a new unique key</code>"
      );
      this.setTimer(ctx, text.message_id, 4000);
      return;
    }
    if (
      ctx.session.new_key.length !== 5 ||
      Number.isInteger(+ctx.session.new_key) === false
    ) {
      const text = await this.reply(
        ctx,
        "<code>The key does not meet the requirements, input a valid unique key</code>"
      );
      this.setTimer(ctx, text.message_id, 3000);
      return;
    }
    ctx.session.user.unique_key = ctx.session.new_key;
    ctx.session.user = await ctx.session.user.save();

    this.removeKeyboard(
      ctx,
      ctx.chat.id,
      `<code>unique key <b>${+ctx.session
        .new_key}</b> updated successfully</code>`,
      4000
    );
    const button = [
      [{ text: "BUY UTILITY", callback_data: "proceed" }],
      [
        { text: "MAIN MENU", callback_data: "main_menu" },
        { text: "HOME PAGE", callback_data: "homepage" },
      ],
    ];
    await this.sendButtons(
      ctx,
      ctx.chat.id,
      "<code>Welcome Back, Select your Option</code>",
      button
    );
    return await ctx.scene.leave();
  }
  // SEND AMOUNT TO PURCAHSE MESSAGE (AIRTIME) --5
  async validateAmountToPurchase(ctx) {
    if (ctx.message.text === "return") {
      this.reply(ctx, `<b>ENTER THE MOBILE NUMBER</b>`);
      return ctx.wizard.selectStep(3);
    }
    if (Number.isInteger(+ctx.message.text) === false || +ctx.message.text < 50)
      return this.del(ctx);
    ctx.session.creditAmount = ctx.message.text || "";
    if (ctx.message.text === "cancel") return await this.exit(ctx);

    // SET NEWORK_ID
    setNetwork_ID(ctx, ctx.session.network_name);

    await this.removeKeyboard(ctx, ctx.chat.id, "<b>processing...</b>", 0);
    const text = `
    <code>You are ready to make a purchase with the details below..</code>
    
NETWORK: <b>${ctx.session.network_name}</b>
MOBILE-NUMBER : <b>${ctx.session.mobile}</b>
AMOUNT: <b>#${ctx.session.creditAmount}</b>
MODEL: <b>${ctx.session.MODEL}</b>
`;
    await this.sendButtons(ctx, ctx.chat.id, text, [
      [
        { text: "RETURN", callback_data: "return_back" },
        { text: "PROCEED", callback_data: "send_request" },
      ],
      [{ text: "CANCEL", callback_data: "cancel_request" }],
    ]);
  }
  // CHECK USER UNIQUE-KEY AND SEND NETWORK BUTTONS
  async sendNetworks(ctx, userKey) {
    if (ctx.session.user.unique_key === userKey) {
      await this.reply(ctx, "🔓");
      let cachedNetworks = await get("all-networks");
      if (!cachedNetworks) {
        const networks = await axios.get(
          `${process.env.DOMAIN}/api/v1/networks/`
        );
        const { data } = networks.data.data;
        cachedNetworks = await this.columnAlgo(data);
        await set("all-networks", cachedNetworks);
      }
      ctx.session.networkKeyboard = cachedNetworks;
      await this.sendKeyboards(
        ctx,
        ctx.chat.id,
        "<b>SELECT YOUR NETWORK</b>",
        cachedNetworks
      );
      return ctx.wizard.next();
    }
    const text = await this.reply(
      ctx,
      `<i>Incorrect Key, Try again or press <b>cancel</b> to exit</i>`
    );
    this.setTimer(ctx, text.message_id, 3000);
    return;
  }
  // SEND DATA PLANS
  async sendDataRequestedPlans(ctx, input) {
    let data_plans = await get("all-data-plans");
    if (!data_plans) {
      const plans = await axios.get(
        `${process.env.DOMAIN}/api/v1/dataplans?isDisabled=false`
      );
      data_plans = plans.data.data.data;
      await set("all-data-plans", data_plans);
    }
    data_plans = data_plans.filter(
      (el) => el.plan_network === input && el.isDisabled === false
    );

    if (data_plans.length === 0)
      return await this.exit(
        ctx,
        `<code>Data Plans Currently Not Available On the Selected Network</code>: <b>${ctx.session.network_name}</b>`
      );
    ctx.session.data_filter = data_plans;
    const buttons = await this.columnAlgo(data_plans);
    ctx.session.planKeyboard = buttons;
    await this.sendKeyboards(
      ctx,
      ctx.chat.id,
      "<b>SELECT YOUR DATA PLAN</b>",
      buttons
    );
    ctx.session.safeBoxPlans = data_plans.map((el) => el.name);
    return ctx.wizard.next();
  }
  // SEND ALL REQUEST (DATA) --5
  async sendAllDataRequest(ctx) {
    ctx.session.plan = ctx.message.text || "";
    if (ctx.message.text === "return") {
      await this.sendKeyboards(
        ctx,
        ctx.chat.id,
        "<b>ENTER THE MOBILE NUMBER</b>",
        [[{ text: "return" }, { text: "cancel" }]]
      );
      return ctx.wizard.selectStep(3);
    }
    if (ctx.message.text === "cancel") return await this.exit(ctx);
    if (!ctx.session.safeBoxPlans.includes(ctx.message.text)) {
      await this.del(ctx, ctx.message.text.message_id);
      const text = await this.reply(
        ctx,
        `<i><b>Invalid Input</b>, Kindly select the available options</i>`
      );
      this.setTimer(ctx, text.message_id, 3000);
      return;
    }

    ctx.session.planDetails = ctx.session.data_filter.find(
      (el) => el.name === ctx.session.plan
    );

    await this.removeKeyboard(ctx, ctx.chat.id, "<b>processing...</b>", 0);
    const text = `
        <code>You are ready to make a purchase with the details below..</code>
        
    NETWORK: <b>${ctx.session.network_name}</b>
    MOBILE-NUMBER : <b>${ctx.session.mobile}</b>
    PLAN: <b>${ctx.session.plan}</b>
    AMOUNT: <b>#${
      ctx.session.MODEL === "LOADED"
        ? ctx.session.planDetails.plan_amount_1
        : ctx.session.planDetails.plan_amount_2
    }</b>
    MODEL: <b>${ctx.session.MODEL}</b>
    `;
    await this.sendButtons(ctx, ctx.chat.id, text, [
      [
        { text: "RETURN", callback_data: "return_back" },
        { text: "PROCEED", callback_data: "send_request" },
      ],
      [{ text: "CANCEL", callback_data: "cancel_request" }],
    ]);
  }
  // EXTRACTED FROM ACTION INSIDE SCENE --
  // IF THE USER DON'T HAVE ENOUGH MONEY
  async walletBalanceLess(ctx) {
    let text = `
    <code>Your Wallet Balance is not sufficient to perform this operation.</code>
    <b>Kindly refund your Wallet!!</b>`;
    const btn = [
      [{ text: "MAIN MENU", callback_data: "main_menu" }],
      [{ text: "FUND WALLET", callback_data: "fund_wallet" }],
    ];
    await this.sendButtons(ctx, ctx.chat.id, text, btn);
    return await ctx.scene.leave();
  }
  // TO CANCEL THE REQUEST OPERATION IN THE SCENE
  async cancelOperation(ctx) {
    let text = `
    <code>Welcome Back</code>
    <code>Select your desired Option</code>
`;
    const btn = [
      [{ text: "BUY", callback_data: "proceed" }],
      [
        { text: "MAIN MENU", callback_data: "main_menu" },
        { text: "HOME PAGE", callback_data: "homepage" },
      ],
    ];
    await ctx.scene.leave();
    await this.sendEditMessageButtons(ctx, text, btn);
    this.removeKeyboard(ctx, ctx.chat.id, `<i>processing..</i>`, 0);
  }
  //  SET UNIQUE KEY
  async askofUniqueKey(ctx) {
    const text =
      "<b>ENTER PREFERED UNIQUE KEY</b> \n<code>Key must be 5 characters long (All Digits) e.g : 12345</code>";
    await this.sendKeyboards(ctx, ctx.chat.id, text,[[{text:'cancel'}]]);
    await ctx.wizard.next();
  }
  // VERIFY USER INPUT AND ASK OF GMAIL
  async askofGmail(ctx) {
    ctx.session.set_uniquekey = ctx.message.text;
    if(ctx.message.text === 'cancel') return await this.exitCreateScene(ctx);
    await this.del(ctx, ctx.message.text.message_id);
    if (
      ctx.session.set_uniquekey.length !== 5 ||
      Number.isInteger(+ctx.message.text) === false
    ) {
      await this.reply(
        ctx,
        "<code>Unique key must be 5 characters long and must be digits</code>"
      );
      return;
    }
    const text = "<b>ENTER GMAIL/EMAIL ADDRESS</b>";
    await this.sendKeyboards(ctx, ctx.chat.id, text, [
      [{ text: "cancel" },{ text: "return" }],
    ]);
    await ctx.wizard.next();
  }
  // VERIFY GMAIL AND ASK OF PHONE-NUMBER
  async askofPhoneNumber(ctx) {
    ctx.session.user_gmail = ctx.message.text;
    if(ctx.message.text === 'cancel') return await this.exitCreateScene(ctx)
    if (ctx.message.text === "return") {
      await this.reply(ctx, "<b>ENTER PREFERED UNIQUE KEY</b>");
      return await ctx.wizard.selectStep(1);
    }
    const user = await User.findOne({ email: ctx.message.text });
    if (user)
      return await this.reply(
        ctx,
        "<code>Email address already registered, Input a unique address</code>"
      );
    let regex = new RegExp("[a-z0-9]+@[a-z]+.[a-z]{2,3}");
    if (regex.test(ctx.message.text) === false)
      return await this.reply(ctx, `<code>Enter a valid email account</code>`);
    await this.reply(ctx, `<b>PROVIDE YOUR PHONE NUMBER WITHOUT (+234)</b>`);
    return ctx.wizard.next();
  }
  // GENERATE ACCOUNT NUMBER
  async generateAccountNumber(ctx) {
    ctx.session.mobile = ctx.message.text;
    const user = await User.findOne({ phone_number: ctx.message.text });
    if (user)
    return await this.reply(
  ctx,
  "<code>Mobile number already exists, Input a unique Mobile number</code>"
  );
   if(ctx.message.text === 'cancel') return await this.exitCreateScene(ctx);
    if (ctx.message.text === "return") {
      await this.reply(ctx, "<b>ENTER GMAIL/EMAIL ADDRESS</b>");
      return await ctx.wizard.selectStep(2);
    }
    if (!isValidPhoneNumber(ctx.session.mobile))
      return this.reply(ctx, `<code>Input a valid phone number</code>`);

    const text = `<code>Click "previous" to go back.\nClick "Generate Account" to generate account number</code>`;
    await this.sendButtons(ctx, ctx.chat.id, text, [
      [{ text: "PREVIOUS", callback_data: "return_back" }],
      [{ text: "GENERATE ACCOUNT", callback_data: "generate_account" }]
    ]);
  }
}

export default helper_scene = new helper_scene();
