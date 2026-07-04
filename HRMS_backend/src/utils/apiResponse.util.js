const { HttpStatusCode } = require("../constants");

class ApiResponse {
  static success(res, statusCode = HttpStatusCode.OK, message = "Success", data = null) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static error(res, statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR, message = "Internal Server Error", errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }
}

module.exports = ApiResponse;
