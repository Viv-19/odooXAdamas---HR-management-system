const prisma = require("../clients/prisma.client");
const { hashPassword, comparePassword } = require("../utils/hash.util");
const { generateToken } = require("../utils/token.util");
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
}

module.exports = AuthService;
