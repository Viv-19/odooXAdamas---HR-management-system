const transporter = require("../config/mail.config");
const env = require("../config/env.config");

class MailService {
  static async sendOtpEmail(toEmail, otp) {
    const mailOptions = {
      from: env.EMAIL_USER,
      to: toEmail,
      subject: "HRMS - Verify your Email (OTP)",
      html: `
        <h2>Welcome to HRMS</h2>
        <p>Your One-Time Password (OTP) for email verification is:</p>
        <h1 style="color: #4A90E2; letter-spacing: 2px;">${otp}</h1>
        <p>This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
      `,
    };

    return transporter.sendMail(mailOptions);
  }

  static async sendPasswordResetOtpEmail(toEmail, otp) {
    const mailOptions = {
      from: env.EMAIL_USER,
      to: toEmail,
      subject: "HRMS - Password Reset OTP",
      html: `
        <h2>Password Reset Request</h2>
        <p>You requested to reset your password. Use the OTP below to verify your identity:</p>
        <h1 style="color: #E24A4A; letter-spacing: 2px;">${otp}</h1>
        <p>This OTP is valid for 10 minutes. If you did not request a password reset, please ignore this email.</p>
      `,
    };

    return transporter.sendMail(mailOptions);
  }
}

module.exports = MailService;
