import { Scenes } from "telegraf";
import helper from "../utils/helper-base.js";
import helper_scene from "../utils/helper-scene.js";

const WizardScene = Scenes.WizardScene;

const resetkey_scene = new WizardScene(
  "reset-key",
  helper.catchAsync(async (ctx, next) => {
    await helper_scene.sendUniqueKeyMessage(ctx);
  }),
  helper.catchAsync(async (ctx, next) => {
    ctx.session.updatekey = true;
    await helper_scene.validateKey(ctx);
    ctx.session.updatekey = false;
  }),
  helper.catchAsync(async (ctx, next) => {
    await helper_scene.updateUniqueKey(ctx);
  })
);

export default resetkey_scene;
