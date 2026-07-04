const express = require("express");
const AuthController = require("../controllers/auth.controller");
const validate = require("../middlewares/validate.middleware");
const { authenticate } = require("../middlewares/auth.middleware");
const { signupSchema, signinSchema, verifyOtpSchema } = require("../validators/auth.validator");

const router = express.Router();

router.post("/signup", validate(signupSchema), AuthController.signup);
router.post("/verify-otp", validate(verifyOtpSchema), AuthController.verifyOtp);
router.post("/signin", validate(signinSchema), AuthController.signin);
router.get("/me", authenticate, AuthController.me);

module.exports = router;
