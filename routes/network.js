import express from "express";
import * as network from "../controllers/network.js";
import * as auth from '../controllers/auth.js'

const router = express.Router();

router.route("/").get(network.getAllNetworks).post(auth.protect,auth.restrictTo('admin'),network.createNetwork);

router.route("/:id").get(network.getNetwork).patch(auth.protect,auth.restrictTo('admin'),network.updateNetwork);

export default router;
