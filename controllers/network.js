import Network from "../models/network.js";
import * as factory from './factory.js';

export const createNetwork = factory.createOne(Network)
export const getNetwork = factory.getOne(Network)
export const getAllNetworks = factory.getAll(Network)
export const updateNetwork = factory.updateOne(Network)