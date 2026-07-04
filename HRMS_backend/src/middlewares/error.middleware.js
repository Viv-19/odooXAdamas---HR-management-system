const ApiResponse = require("../utils/apiResponse.util");
const { HttpStatusCode } = require("../constants");

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  console.error(err.stack || err.message);

  const message = err.message || "Internal Server Error";
  let statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;

  // Map some known error messages to bad request
  if (
    message.includes("already exists") ||
    message.includes("Invalid credentials") ||
    message.includes("not found") ||
    message.includes("expired") ||
    message.includes("Invalid OTP")
  ) {
    statusCode = HttpStatusCode.BAD_REQUEST;
  }

  return ApiResponse.error(res, statusCode, message);
};

module.exports = errorHandler;
