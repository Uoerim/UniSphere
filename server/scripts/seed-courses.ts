import "dotenv/config";
import { prisma } from "../src/prisma";

async function seedCourses() {
  try {
    console.log("=" + "=".repeat(48));
    console.log("Seeding Sample Courses");
    console.log("=" + "=".repeat(48));

    // Find admin account to get or create staff record
    const adminAccount = await prisma.account.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!adminAccount) {
      console.log("❌ No admin account found. Please create one first.");
      return;
    }

    console.log(`✓ Found admin account: ${adminAccount.email}`);

    // Get or create staff record for admin
    let staff = await prisma.staff.findUnique({
      where: { accountId: adminAccount.id }
    });

    if (!staff) {
      console.log("Creating staff record for admin...");
      staff = await prisma.staff.create({
        data: {
          accountId: adminAccount.id,
          firstName: adminAccount.email.split('@')[0],
          lastName: 'Admin',
          email: adminAccount.email,
        }
      });
      console.log(`✓ Created staff record: ${staff.id}`);
    } else {
      console.log(`✓ Staff record exists: ${staff.id}`);
    }

    // Create sample students
    console.log("\nCreating sample students...");
    const students = [];
    for (let i = 1; i <= 5; i++) {
      const studentAccount = await prisma.account.upsert({
        where: { email: `student${i}@university.edu` },
        update: {},
        create: {
          email: `student${i}@university.edu`,
          password: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890', // hashed 'password'
          role: 'STUDENT'
        }
      });

      const student = await prisma.student.upsert({
        where: { accountId: studentAccount.id },
        update: {},
        create: {
          accountId: studentAccount.id,
          firstName: `Student`,
          lastName: `${i}`,
          email: `student${i}@university.edu`,
          studentId: `STU${String(i).padStart(4, '0')}`
        }
      });
      students.push(student);
    }
    console.log(`✓ Created ${students.length} sample students`);

    // Create sample courses
    console.log("\nCreating sample courses...");
    const coursesData = [
      {
        code: 'CS101',
        name: 'Introduction to Computer Science',
        description: 'Fundamentals of programming and computer science',
        credits: 3,
        department: 'Computer Science',
        schedule: 'Mon/Wed 10:00-11:30',
        room: 'Room 101',
        capacity: 30
      },
      {
        code: 'CS202',
        name: 'Data Structures and Algorithms',
        description: 'Advanced data structures and algorithm design',
        credits: 4,
        department: 'Computer Science',
        schedule: 'Tue/Thu 14:00-15:30',
        room: 'Room 205',
        capacity: 25
      },
      {
        code: 'MATH301',
        name: 'Linear Algebra',
        description: 'Matrices, vector spaces, and linear transformations',
        credits: 3,
        department: 'Mathematics',
        schedule: 'Mon/Wed/Fri 09:00-10:00',
        room: 'Room 310',
        capacity: 35
      }
    ];

    for (const courseData of coursesData) {
      const course = await prisma.course.upsert({
        where: { code: courseData.code },
        update: {
          staffId: staff.id,
        },
        create: {
          ...courseData,
          staffId: staff.id,
          semester: 'Spring 2025',
          year: 2025,
        }
      });

      console.log(`✓ Created/Updated course: ${course.code} - ${course.name}`);

      // Enroll 3 random students in each course
      const enrolledStudents = students.slice(0, 3);
      for (const student of enrolledStudents) {
        await prisma.courseEnrollment.upsert({
          where: {
            studentId_courseId: {
              studentId: student.id,
              courseId: course.id
            }
          },
          update: {},
          create: {
            studentId: student.id,
            courseId: course.id,
            enrollmentDate: new Date()
          }
        });
      }
      console.log(`  → Enrolled ${enrolledStudents.length} students`);
    }

    console.log("\n" + "=".repeat(50));
    console.log("✅ Sample courses created successfully!");
    console.log("=".repeat(50));

  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

seedCourses();
