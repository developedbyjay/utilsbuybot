import express from "express";
import * as sessions from "../controllers/sessions.js";

const router = express.Router();

router
  .route("/")
  .get(sessions.getAllSessions)
  .post(sessions.createSessions)
  .delete(sessions.deleteAllSessions);

router.route("/:id").get(sessions.getSessions).delete(sessions.deleteSessions);

export default router;
