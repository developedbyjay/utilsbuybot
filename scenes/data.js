import { Scenes } from "telegraf";
import helper from "../utils/helper-base.js";
import helper_scene from "../utils/helper-scene.js";
import { send_request_func, return_back_func } from "../utils/base-help.js";

const WizardScene = Scenes.WizardScene;

const data_scene = new WizardScene(
  "data",
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
    await helper_scene.validatePhoneNumber(ctx, "data");
  }),
  helper.catchAsync(async (ctx, next) => {
    await helper_scene.sendAllDataRequest(ctx);
  })
);


data_scene.command(
  "cancel",
  helper.catchAsync(async (ctx, next) => {
      await helper.exit(ctx);
  })
);
// HANDLES CLICKS IN THE SCENE (send_request)
data_scene.action(
  "send_request",
  helper.catchAsync(async (ctx, next) => {
    ctx.session.MODEL === "LOADED"
      ? (ctx.session.plan_amount = ctx.session.planDetails.plan_amount_1)
      : (ctx.session.plan_amount = ctx.session.planDetails.plan_amount_2);
    return await send_request_func(ctx, "data");
  })
);

// HANDLES CLICKS IN THE SCENE (return)
data_scene.action(
  "return_back",
  helper.catchAsync(async (ctx, next) => {
    await return_back_func(
      ctx,
      "<b>SELECT YOUR DATA PLAN</b>",
      ctx.session.planKeyboard,
      4
    );
  })
);

// HANDLES CLICKS IN THE SCENE (cancel)
data_scene.action(
  "cancel_request",
  helper.catchAsync(async (ctx, next) => {
    await helper.ansQ(ctx, "processing...");
    await helper_scene.cancelOperation(ctx);
  })
);

export default data_scene;
