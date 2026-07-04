const app = require("./app");
const env = require("./src/config/env.config");
const prisma = require("./src/clients/prisma.client");

const PORT = env.PORT || 5000;

async function bootstrap() {
  try {
    // Check DB connection
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT} in ${env.NODE_ENV} mode`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();
