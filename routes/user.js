import express from "express";
import * as user from "../controllers/user.js";
import * as auth from "../controllers/auth.js";

const router = express.Router();

router
  .route("/")
  .get(auth.protect, auth.restrictTo("admin"), user.getAllUsers)
  .post(user.createUser);

router.use(auth.protect);

router
  .route("/:id")
  .get(user.getUser)
  .delete(auth.restrictTo("admin"), user.deleteUser)
  .patch(auth.restrictTo("admin"), user.updateUser);

export default router;
