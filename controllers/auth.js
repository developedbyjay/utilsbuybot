import jwt from "jsonwebtoken";
import { promisify } from "util";
import User from "../models/user.js";
import helper from "../utils/helper-base.js";
import AppError from "../utils/app-error.js";

export const protect = helper.catchAsyncApi(async (req, res, next) => {
  let token;
  const { authorization } = req.headers;
  if (authorization && authorization.startsWith("Bearer")) {
    token = authorization.split(" ")[1];
  }
  if (!token) {
    return next(
      new AppError("Kindly Provide your token, Token not received", 401)
    );
  }
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError("The user belonging to the token does no longer exist", 401)
    );
  }

  req.user = currentUser;
  next();
});

export const restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.roles)) {
    return next(
      new AppError("You do not have permission to perform this action", 403)
    );
  }
  next();
};
