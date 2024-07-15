import Sessions from "../models/sessions.js";
import * as factory from "./factory.js";

export const createSessions = factory.createOne(Sessions);
export const getSessions = factory.getOne(Sessions);
export const getAllSessions = factory.getAll(Sessions);
export const deleteSessions = factory.deleteOne(Sessions);
export const deleteAllSessions = factory.deleteAll(Sessions);
