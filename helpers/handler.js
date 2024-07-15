import context from "./config.js";
import helper from "../utils/helper-base.js";

// FOR START HANDLER
export const startHandler = async (options) => {
  const buttons = [
    [{ text: "CREATE ACCOUNT", callback_data: "set-key" }],
    [
      { text: "CHECK PRICES", callback_data: "check_price" },
      { text: "MAIN MENU", callback_data: "main_menu" },
    ],
    [{ text: "HELP", callback_data: "help" },{ text: "SETTINGS", callback_data: "settings" }]
  ];

  if (options.check) {
    buttons.forEach((el, i) => {
      if (el[0].text === "CREATE ACCOUNT") buttons.splice(i, 1);
    });
  }

  if (options?.ctx?.callbackQuery) await helper.ansQdel(options.ctx);

  return await helper.sendButtons(
    options.ctx,
    options.ctx.chat.id,
    context.initial_text,
    buttons
  );
};
