import AppError from "../utils/app-error.js";
import helper from "../utils/helper-base.js";

export const createOne = (Model) =>
  helper.catchAsyncApi(async (req, res, next) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
      status: "success",
      data: {
        doc,
      },
    });
  });

export const getOne = (Model) =>
  helper.catchAsyncApi(async (req, res, next) => {
    const id = +req.params.id;
    const doc = await Model.findOne({ id });
    const docName = Model.modelName.toLowerCase();
    if (!doc)
      return next(new AppError(`No ${docName} found with that ID`, 404));
    res.status(200).json({
      status: "Success",
      data: {
        data: doc,
      },
    });
  });

export const getAll = (Model) =>
  helper.catchAsyncApi(async (req, res, next) => {
    let filter = { ...req.query };
    let docs = Model.find(filter);
    if (req.query.sortBy) docs.sort({ createdAt: -1 });
    docs = await docs;
    const docName = Model.modelName.toLowerCase();
    if (!docs)
      return next(new AppError(`No ${docName} found with that ID`, 404));
    res.status(200).json({
      status: "Success",
      results: docs.length,
      data: {
        data: docs,
      },
    });
    return docs;
  });

export const deleteOne = (Model) =>
  helper.catchAsyncApi(async (req, res, next) => {
    const id = +req.params.id;
    const doc = await Model.findOneAndDelete({ id });
    const docName = Model.modelName.toLowerCase();
    if (!doc)
      return next(new AppError(`No ${docName} found with that ID`, 404));

    res.status(204).json({
      status: "success",
      data: null,
    });
  });

export const updateOne = (Model) =>
  helper.catchAsyncApi(async (req, res, next) => {
    const id = +req.params.id;
    const doc = await Model.findOneAndUpdate({id}, req.body, {
      new: true,
      runValidators: true,
    });
    const docName = Model.modelName.toLowerCase();
    if (!doc)
      return next(new AppError(`No ${docName} found with that ID`, 404));

    res.status(201).json({
      status: "success",
      data: {
        data: doc,
      },
    });
  });

export const deleteAll = (Model) =>
  helper.catchAsyncApi(async (req, res, next) => {
    const doc = await Model.deleteMany();
    const docName = Model.modelName.toLowerCase();
    if (!doc) return next(new AppError(`${docName} is Empty`, 404));
    res.status(200).json({
      status: "success",
      message: `All ${docName} deleted`,
    });
  });
