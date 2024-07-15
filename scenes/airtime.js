import { Scenes } from "telegraf";
import helper from "../utils/helper-base.js";
import helper_scene from "../utils/helper-scene.js";
import { send_request_func, return_back_func } from "../utils/base-help.js";

const WizardScene = Scenes.WizardScene;

const airtime_scene = new WizardScene(
  "airtime",
  helper.catchAsync(async (ctx, next) => {
    await helper_scene.sendUniqueKeyMessage(ctx);
  }),
  helper.catchAsync(async (ctx, next) => {
    await helper_scene.validateKey(ctx);
  }),
  helper.catchAsync(async (ctx, next) => {
    await helper_scene.sendPhoneNumberMessage(ctx);
  }),
  helper.catchAsync(async (ctx, next) => {
    await helper_scene.validatePhoneNumber(ctx, "airtime");
  }),
  helper.catchAsync(async (ctx, next) => {
    await helper_scene.validateAmountToPurchase(ctx);
  })
);

airtime_scene.command(
  "cancel",
  helper.catchAsync(async (ctx, next) => {
      await helper.exit(ctx);
  })
); 


// HANDLES CLICKS IN THE SCENE (send_request)
airtime_scene.action(
  "send_request",
  helper.catchAsync(async (ctx, next) => {
    await send_request_func(ctx, "airtime");
  })
);
// HANDLES CLICKS IN THE SCENE (return)
airtime_scene.action(
  "return_back",
  helper.catchAsync(async (ctx, next) => {
    await return_back_func(ctx, `<b>ENTER THE AMOUNT</b>`, [
      [{ text: "return" }, { text: "cancel" }],
    ],4);
  })
);

// HANDLES CLICKS IN THE SCENE (cancel)
airtime_scene.action(
  "cancel_request",
  helper.catchAsync(async (ctx, next) => {
    await helper.ansQ(ctx, "processing...");
    helper_scene.cancelOperation(ctx);
  })
);

export default airtime_scene;
