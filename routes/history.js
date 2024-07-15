import express from "express";
import * as history from "../controllers/history.js";
import * as auth from "../controllers/auth.js";

const router = express.Router();

router.use(auth.protect);

router
  .route("/")
  .get(history.getAllHistory)
  .post(history.createHistory)
  .delete(auth.restrictTo("admin"), history.deleteAllHistory);

router
  .route("/:id")
  .get(history.getHistory)
  .patch(auth.restrictTo("admin"), history.updateHistory);

export default router;
