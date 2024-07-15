import User from "../models/user.js";
import * as factory from './factory.js';


export const createUser = factory.createOne(User);
export const getUser = factory.getOne(User);
export const getAllUsers = factory.getAll(User);
export const updateUser = factory.updateOne(User);
export const deleteUser = factory.deleteOne(User);
