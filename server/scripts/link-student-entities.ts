import "dotenv/config";
import { prisma } from "../src/prisma";

// This script links all student accounts to a STUDENT entity if missing
async function linkStudentEntities() {
  try {
    console.log("=".repeat(30));
    console.log("Linking Student Accounts to Entities");
    console.log("=".repeat(30));

    // Find all student accounts without an entity
    const students = await prisma.account.findMany({
      where: {
        role: 'STUDENT',
        entityId: null,
      },
    });

    if (students.length === 0) {
      console.log('All student accounts are already linked to entities.');
      return;
    }

    for (const student of students) {
      // Create a new STUDENT entity
      const entity = await prisma.entity.create({
        data: {
          type: 'STUDENT',
          name: student.email,
          isActive: true,
        },
      });
      // Link the account to the entity
      await prisma.account.update({
        where: { id: student.id },
        data: { entityId: entity.id },
      });
      console.log(`Linked student ${student.email} to entity ${entity.id}`);
    }
  } catch (error: any) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
    console.log("\nDatabase connection closed.");
  }
}

linkStudentEntities();
