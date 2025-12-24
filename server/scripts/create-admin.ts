import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../src/prisma";

// Admin user details
const adminData = {
  email: "admin@admin.com",
  password: "admin",
  role: "ADMIN" as const
};

async function createAdminUser() {
  try {
    console.log("=" + "=".repeat(48));
    console.log("Creating Admin User");
    console.log("=" + "=".repeat(48));

    // Check if user already exists
    console.log("Checking if user already exists...");
    const existingUser = await prisma.account.findUnique({
      where: { email: adminData.email }
    });

    if (existingUser) {
      console.log(`❌ User with email '${adminData.email}' already exists!`);
      return;
    }

    // Hash the password
    console.log("Hashing password...");
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // Create the admin user
    console.log("Creating admin user...");
    const admin = await prisma.account.create({
      data: {
        email: adminData.email,
        password: hashedPassword,
        role: adminData.role
      }
    });

    console.log("✅ Admin user created successfully!");
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   ID: ${admin.id}`);

  } catch (error: any) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
    console.log("\nDatabase connection closed.");
  }
}

createAdminUser();
