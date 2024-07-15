export default class extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.msg = message;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
