import History from "../models/history.js";
import * as factory from "./factory.js";

export const createHistory = factory.createOne(History);
export const getHistory = factory.getOne(History);
export const getAllHistory = factory.getAll(History);
export const updateHistory = factory.updateOne(History);
export const deleteAllHistory = factory.deleteAll(History);
