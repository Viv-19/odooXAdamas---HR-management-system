const ApiResponse = require("../utils/apiResponse.util");
const { HttpStatusCode } = require("../constants");

const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => detail.message);
      return ApiResponse.error(res, HttpStatusCode.BAD_REQUEST, "Validation failed", errors);
    }

    next();
  };
};

module.exports = validate;
