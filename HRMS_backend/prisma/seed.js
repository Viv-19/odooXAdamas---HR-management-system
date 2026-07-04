const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function main() {
  const email = "academicsloth202020@gmail.com";
  const password = await hashPassword("00@Vivesh");
  
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      employeeId: "ADMIN-001",
      email,
      password,
      role: "ADMIN",
      isVerified: true,
      profile: {
        create: {
          firstName: "Admin",
          lastName: "Vivesh"
        }
      }
    }
  });
  console.log("Database Seeded! Admin user created:", user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
