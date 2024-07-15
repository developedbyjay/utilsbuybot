import AppError from "../utils/app-error.js";

const handleCastErrorDB = (error) => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (error) => {
  // const value = error.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const message = `Duplicate field value: ${error.keyValue.name}. Please use another value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (error) => {
  const errors = Object.values(error.errors).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError("Invalid Token, Please login again", 401);

const handleExpiredToken = () => new AppError("Token Expired,Login again", 401);

const sendErrorProd = (error, res) => {
  if (error.isOperational) {
    res.status(error.statusCode).json({
      status: error.status,
      message: error.msg,
    });
    return;
  }

  // logging Errors
  console.error(error);
  // sending Errors to client
  res.status(500).json({
    status: "error",
    message: `Something went very wrong`,
  });
};

const sendErrorDev = (error, res) => {
  console.log(error);
  res.status(error.statusCode).json({
    status: error.status,
    message: error.msg,
    stack: error.stack,
    error,
  });
};

const error = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";
  if (process.env.ENVIRONMENT === "development") {
    sendErrorDev(err, res);
  } else if (process.env.ENVIRONMENT === "production") {
    let error = { ...err };
    // console.log(err)
    // Invalid ID e.g dg47174
    if (err.name === "CastError") error = handleCastErrorDB(error);
    // Duplicate Values
    if (err.code === 11000) error = handleDuplicateFieldsDB(error);
    // Validation Error
    if (err.name === "ValidationError") error = handleValidationErrorDB(error);
    if (err.name === "JsonWebTokenError") error = handleJWTError();
    if (err.name === "TokenExpiredError") error = handleExpiredToken();
    // Trigger the Function

    sendErrorProd(error, res);
  }
};

export default error;
