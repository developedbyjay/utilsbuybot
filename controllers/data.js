import helper from "../utils/helper-base.js";
import dataPlan from "../models/data.js";
import AppError from "../utils/app-error.js";
import { get, set } from "../requests/cache.js";
import * as factory from "./factory.js";

export const createDataPlan = factory.createOne(dataPlan);
export const getDataPlan = factory.getOne(dataPlan);
export const getAllDataPlans = factory.getAll(dataPlan);
export const deleteDataPlan = factory.deleteOne(dataPlan);
export const updateDataPlan = helper.catchAsyncApi(async (req, res, next) => {
  const id = +req.params.id;
  const docName = dataPlan.modelName.toLowerCase();

  // FOR UPDATING A TARGET PLAN
  if (req.body.restrict === "true") {
    const doc = await dataPlan.findOneAndUpdate({ id }, req.body, {
      new: true,
      runValidators: true,
    });
    if (!doc)
      return next(new AppError(`No ${docName} found with that ID`, 404));

    const data = await factory.getAll(dataPlan)(req, res, next);
    await set("all-data-plans", data);

    return data;
  }

  // FOR UPDATING SPECIFIC PLAN PRICES CONCURRENTLY
  if (req.body.model_type) {
    const plan = await dataPlan.findOne({ id });

    if (!plan)
      return next(new AppError(`No ${docName} found with that ID`, 404));

    const dataplans = await dataPlan.find({
      plan_type: plan.plan_type,
      network: plan.network,
    });

    if (dataplans.length === 0)
      return next(new AppError(`No ${docName} found with that ID`, 404));

    let price;
    const promises = dataplans.map(async (plan) => {
      req.body.model_type === 'LOADED' ? (price = plan.rate * req.body.plan_amount_1) :  (price = plan.rate * req.body.plan_amount_2);
      switch (req.body.model_type) {
        case "LOADED":
          return await dataPlan.findOneAndUpdate(
            {
              id: plan.id,
              plan_type: plan.plan_type,
            },
            { plan_amount_1: price },
            {
              new: true,
            }
          );
        case "RE-LOADED":
          return await dataPlan.findOneAndUpdate(
            {
              id: plan.id,
              plan_type: plan.plan_type,
            },
            { plan_amount_2: price },
            {
              new: true,
            }
          );
      }
    });
    await Promise.all(promises);

    const data = await factory.getAll(dataPlan)(req, res, next);
    await set("all-data-plans", data);

    return data;
  }
});

export const updateAllPlan = helper.catchAsyncApi(async (req, res, next) => {
  req.query.isDisabled = req.query.isDisabled === "true" ? true : false;
  await dataPlan.updateMany(
    { plan_type: req.query.plan_type, plan_network: req.query.plan_network },
    { isDisabled: req.query.isDisabled },
    { new: true }
  );
  const data = await dataPlan.find();
  await set("all-data-plans", data);

  res.status(200).json({
    status: "All plans successfully updated",
  });
});
