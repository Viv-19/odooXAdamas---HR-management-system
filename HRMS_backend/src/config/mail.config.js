const nodemailer = require("nodemailer");
const env = require("./env.config");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

module.exports = transporter;
