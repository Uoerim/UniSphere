// Test script to verify TEACHES relations
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkTeachesRelations() {
  try {
    // Get all TEACHES relations
    const teachesRelations = await prisma.entityRelation.findMany({
      where: { relationType: 'TEACHES' },
      include: {
        fromEntity: { select: { id: true, name: true, type: true } },
        toEntity: { select: { id: true, name: true, type: true } }
      },
      take: 20
    });

    console.log('=== TEACHES Relations ===');
    console.log(JSON.stringify(teachesRelations, null, 2));
    
    // Get all staff accounts
    const staffAccounts = await prisma.account.findMany({
      where: { role: 'STAFF' },
      include: { entity: { select: { id: true, name: true } } }
    });

    console.log('\n=== STAFF Accounts ===');
    console.log(JSON.stringify(staffAccounts, null, 2));

    // Get all courses
    const courses = await prisma.entity.findMany({
      where: { type: 'Course' },
      select: { id: true, name: true }
    });

    console.log('\n=== Courses ===');
    console.log(JSON.stringify(courses, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTeachesRelations();
