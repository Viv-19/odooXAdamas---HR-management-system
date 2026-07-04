const express = require("express");
const AuthController = require("../controllers/auth.controller");
const validate = require("../middlewares/validate.middleware");
const { authenticate } = require("../middlewares/auth.middleware");
const { signupSchema, signinSchema, verifyOtpSchema, forgotPasswordSchema, verifyPasswordResetOtpSchema, resetPasswordSchema } = require("../validators/auth.validator");

const router = express.Router();

router.post("/signup", validate(signupSchema), AuthController.signup);
router.post("/verify-otp", validate(verifyOtpSchema), AuthController.verifyOtp);
router.post("/signin", validate(signinSchema), AuthController.signin);
router.get("/me", authenticate, AuthController.me);

// Password reset flow
router.post("/forgot-password", validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post("/verify-reset-otp", validate(verifyPasswordResetOtpSchema), AuthController.verifyPasswordResetOtp);
router.post("/reset-password", validate(resetPasswordSchema), AuthController.resetPassword);

module.exports = router;
