import mongoose from "mongoose";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname } from "path";
import Dataplan from "../models/data.js";
import User from "../models/user.js";
import History from "../models/history.js";

const DATABASE = 'mongodb+srv://user:user@utilbuybot.woofr1j.mongodb.net/?retryWrites=true&w=majority'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

(async () => {
  try {
    await mongoose.connect(DATABASE);
    console.log("DB connected");
  } catch (err) {
    console.log(err);
  }
})();

const data_plan = JSON.parse(fs.readFileSync(`${__dirname}/data-plan.json`));

const importData = async () => {
  try {
    await Dataplan.create(data_plan);
    console.log("documents created");
  } catch (err) {
    console.error(err);
  }
};

const deleteData = async () => {
  try {
    await Dataplan.deleteMany();
    console.log("documents deleted");
  } catch (err) {
    console.error(err);
  }
};

if (process.argv[2] === "--import") importData();
if (process.argv[2] === "--delete") deleteData();
