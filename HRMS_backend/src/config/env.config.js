require("dotenv").config();

/**
 * Centralized environment configuration.
 * All env vars are loaded and validated here — no raw process.env elsewhere.
 */
const env = {
  // Server
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database
  DATABASE_URL: process.env.DATABASE_URL,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || "fallback-secret-change-me",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "24h",

  // Email
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS,

  // Frontend URL (for email verification links)
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
};

// Validate required env vars
const requiredVars = ["DATABASE_URL", "JWT_SECRET", "EMAIL_USER", "EMAIL_PASS"];

for (const varName of requiredVars) {
  if (!env[varName]) {
    console.error(`❌ Missing required environment variable: ${varName}`);
    process.exit(1);
  }
}

module.exports = env;
