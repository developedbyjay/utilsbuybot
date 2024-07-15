import express from "express";
import * as data from "../controllers/data.js";
import * as auth from "../controllers/auth.js";

const router = express.Router();

router
  .route("/")
  .get(data.getAllDataPlans)
  .post(auth.protect, auth.restrictTo("admin"), data.createDataPlan)
  .patch(auth.protect, auth.restrictTo("admin"), data.updateAllPlan);

router
  .route("/:id")
  .get(data.getDataPlan)
  .delete(auth.protect, auth.restrictTo("admin"), data.deleteDataPlan)
  .patch(data.updateDataPlan);

export default router;
