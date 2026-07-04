const prisma = require("../clients/prisma.client");
const { hashPassword, comparePassword } = require("../utils/hash.util");
const { generateToken, verifyToken } = require("../utils/token.util");
const MailService = require("./mail.service");

class AuthService {
  /**
   * Generates a 6-digit OTP
   */
  static _generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  static async signup({ employeeId, email, password, role }) {
    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { employeeId }],
      },
    });

    if (existingUser) {
      throw new Error("User with this email or employee ID already exists");
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user in a transaction with OTP
    const otp = this._generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          employeeId,
          email,
          password: hashedPassword,
          role: role || "EMPLOYEE",
          profile: {
            create: {
              firstName: "User",
              lastName: employeeId, // Using ID as placeholder until they edit it
            }
          }
        },
      });

      await tx.emailVerification.create({
        data: {
          userId: newUser.id,
          token: otp, // Match new schema field name
          expiresAt,
        },
      });

      return newUser;
    });

    // Send OTP via email
    await MailService.sendOtpEmail(email, otp);

    return {
      id: user.id,
      email: user.email,
      employeeId: user.employeeId,
      message: "Signup successful. Please verify your email with the OTP sent.",
    };
  }

  static async verifyOtp({ email, otp }) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("User not found");
    }

    if (user.isVerified) {
      throw new Error("Email is already verified");
    }

    const verificationRecord = await prisma.emailVerification.findFirst({
      where: {
        userId: user.id,
        token: otp,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!verificationRecord) {
      throw new Error("Invalid OTP");
    }

    if (new Date() > verificationRecord.expiresAt) {
      throw new Error("OTP has expired");
    }

    // Mark user as verified and delete token record as it has no "used" flag anymore
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { isVerified: true }, // Match new schema field name
      });

      await tx.emailVerification.delete({
        where: { id: verificationRecord.id },
      });
    });

    return { message: "Email successfully verified" };
  }

  static async signin({ email, password }) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("Invalid credentials");
    }

    if (!user.isVerified) {
      throw new Error("Please verify your email before logging in");
    }

    const isMatch = await comparePassword(password, user.password); // Match new schema field name
    if (!isMatch) {
      throw new Error("Invalid credentials");
    }

    // Generate JWT
    const token = generateToken({
      userId: user.id,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        employeeId: user.employeeId,
        role: user.role,
      },
    };
  }

  static async forgotPassword({ email }) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("No account found with this email");
    }

    if (!user.isVerified) {
      throw new Error("Please verify your email first");
    }

    // Delete any existing password reset OTPs for this user
    await prisma.passwordResetOtp.deleteMany({
      where: { userId: user.id },
    });

    // Generate and store new OTP
    const otp = this._generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await prisma.passwordResetOtp.create({
      data: {
        userId: user.id,
        token: otp,
        expiresAt,
      },
    });

    // Send OTP email
    await MailService.sendPasswordResetOtpEmail(email, otp);

    return { message: "Password reset OTP sent to your email" };
  }

  static async verifyPasswordResetOtp({ email, otp }) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const otpRecord = await prisma.passwordResetOtp.findFirst({
      where: {
        userId: user.id,
        token: otp,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      throw new Error("Invalid OTP");
    }

    if (new Date() > otpRecord.expiresAt) {
      // Clean up expired OTP
      await prisma.passwordResetOtp.delete({ where: { id: otpRecord.id } });
      throw new Error("OTP has expired. Please request a new one");
    }

    // Delete the used OTP
    await prisma.passwordResetOtp.delete({ where: { id: otpRecord.id } });

    // Generate a short-lived reset token (10 minutes)
    const resetToken = generateToken(
      { userId: user.id, purpose: "password-reset" },
    );

    return { resetToken, message: "OTP verified successfully" };
  }

  static async resetPassword({ email, resetToken, password }) {
    // Verify the reset token
    const decoded = verifyToken(resetToken);
    if (!decoded || decoded.purpose !== "password-reset") {
      throw new Error("Invalid or expired reset token. Please restart the process");
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Ensure token belongs to this user
    if (decoded.userId !== user.id) {
      throw new Error("Invalid reset token for this account");
    }

    // Hash and update password
    const hashedPassword = await hashPassword(password);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Clean up any remaining OTPs for this user
    await prisma.passwordResetOtp.deleteMany({
      where: { userId: user.id },
    });

    return { message: "Password reset successfully" };
  }
}

module.exports = AuthService;
