const AuthService = require("../services/auth.service");
const ApiResponse = require("../utils/apiResponse.util");
const { HttpStatusCode } = require("../constants");

class AuthController {
  static async signup(req, res, next) {
    try {
      // Removing confirmPassword before passing to service
      const { confirmPassword, ...signupData } = req.body;
      const result = await AuthService.signup(signupData);
      return ApiResponse.success(res, HttpStatusCode.CREATED, "User registered successfully", result);
    } catch (error) {
      next(error);
    }
  }

  static async verifyOtp(req, res, next) {
    try {
      const result = await AuthService.verifyOtp(req.body);
      return ApiResponse.success(res, HttpStatusCode.OK, "OTP verified successfully", result);
    } catch (error) {
      next(error);
    }
  }

  static async signin(req, res, next) {
    try {
      const result = await AuthService.signin(req.body);
      return ApiResponse.success(res, HttpStatusCode.OK, "Signed in successfully", result);
    } catch (error) {
      next(error);
    }
  }

  static async me(req, res, next) {
    try {
      // req.user is set by auth middleware
      return ApiResponse.success(res, HttpStatusCode.OK, "User profile fetched successfully", { user: req.user });
    } catch (error) {
      next(error);
    }
  }

  static async forgotPassword(req, res, next) {
    try {
      const result = await AuthService.forgotPassword(req.body);
      return ApiResponse.success(res, HttpStatusCode.OK, "Password reset OTP sent to your email", result);
    } catch (error) {
      next(error);
    }
  }

  static async verifyPasswordResetOtp(req, res, next) {
    try {
      const result = await AuthService.verifyPasswordResetOtp(req.body);
      return ApiResponse.success(res, HttpStatusCode.OK, "OTP verified successfully", result);
    } catch (error) {
      next(error);
    }
  }

  static async resetPassword(req, res, next) {
    try {
      const { confirmPassword, ...resetData } = req.body;
      const result = await AuthService.resetPassword(resetData);
      return ApiResponse.success(res, HttpStatusCode.OK, "Password reset successfully", result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
