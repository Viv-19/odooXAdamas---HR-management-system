const Joi = require("joi");
const { Role } = require("../constants");

const signupSchema = Joi.object({
  employeeId: Joi.string().required().messages({
    "any.required": "Employee ID is required",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp("(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])"))
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters long",
      "string.pattern.base": "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character",
      "any.required": "Password is required",
    }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match",
    "any.required": "Confirm Password is required",
  }),
  role: Joi.string()
    .valid(Role.EMPLOYEE, Role.HR, Role.ADMIN)
    .default(Role.EMPLOYEE),
});

const signinSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
  otp: Joi.string().length(6).required().messages({
    "string.length": "OTP must be exactly 6 characters long",
    "any.required": "OTP is required",
  }),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
});

const verifyPasswordResetOtpSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
  otp: Joi.string().length(6).required().messages({
    "string.length": "OTP must be exactly 6 characters long",
    "any.required": "OTP is required",
  }),
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),
  resetToken: Joi.string().required().messages({
    "any.required": "Reset token is required",
  }),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp("(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^A-Za-z0-9])"))
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters long",
      "string.pattern.base": "Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character",
      "any.required": "Password is required",
    }),
  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Passwords do not match",
    "any.required": "Confirm Password is required",
  }),
});

module.exports = {
  signupSchema,
  signinSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  verifyPasswordResetOtpSchema,
  resetPasswordSchema,
};
