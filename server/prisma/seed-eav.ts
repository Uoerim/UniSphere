import { PrismaClient, AttributeDataType, AttributeCategory } from '@prisma/client';

const prisma = new PrismaClient();

// Predefined attributes for all entity types
interface AttributeDefinition {
    name: string;
    displayName: string;
    dataType: AttributeDataType;
    category: AttributeCategory;
    entityTypes: string[];  // Using string for flexibility with all entity types
    isRequired?: boolean;
    description?: string;
}

const attributes: AttributeDefinition[] = [
    // ===== STUDENT ATTRIBUTES =====
    { name: 'firstName', displayName: 'First Name', dataType: 'STRING', category: 'PERSONAL', entityTypes: ['STUDENT', 'STAFF', 'PARENT'], isRequired: true },
    { name: 'lastName', displayName: 'Last Name', dataType: 'STRING', category: 'PERSONAL', entityTypes: ['STUDENT', 'STAFF', 'PARENT'], isRequired: true },
    { name: 'email', displayName: 'Email', dataType: 'EMAIL', category: 'CONTACT', entityTypes: ['STUDENT', 'STAFF', 'PARENT'], isRequired: true },
    { name: 'phone', displayName: 'Phone', dataType: 'PHONE', category: 'CONTACT', entityTypes: ['STUDENT', 'STAFF', 'PARENT'] },
    { name: 'address', displayName: 'Address', dataType: 'TEXT', category: 'CONTACT', entityTypes: ['STUDENT', 'STAFF', 'PARENT'] },
    { name: 'dateOfBirth', displayName: 'Date of Birth', dataType: 'DATE', category: 'PERSONAL', entityTypes: ['STUDENT', 'STAFF', 'PARENT'] },
    { name: 'studentId', displayName: 'Student ID', dataType: 'STRING', category: 'ACADEMIC', entityTypes: ['STUDENT'], isRequired: true },
    { name: 'program', displayName: 'Program', dataType: 'STRING', category: 'ACADEMIC', entityTypes: ['STUDENT'] },
    { name: 'year', displayName: 'Year', dataType: 'STRING', category: 'ACADEMIC', entityTypes: ['STUDENT'] },
    { name: 'gpa', displayName: 'GPA', dataType: 'NUMBER', category: 'ACADEMIC', entityTypes: ['STUDENT'] },
    { name: 'advisor', displayName: 'Advisor', dataType: 'STRING', category: 'ACADEMIC', entityTypes: ['STUDENT'] },
    { name: 'emergencyContact', displayName: 'Emergency Contact', dataType: 'STRING', category: 'CONTACT', entityTypes: ['STUDENT'] },
    { name: 'emergencyPhone', displayName: 'Emergency Phone', dataType: 'PHONE', category: 'CONTACT', entityTypes: ['STUDENT'] },
    { name: 'enrollmentDate', displayName: 'Enrollment Date', dataType: 'DATE', category: 'ACADEMIC', entityTypes: ['STUDENT'] },

    // ===== STAFF ATTRIBUTES =====
    { name: 'department', displayName: 'Department', dataType: 'STRING', category: 'EMPLOYMENT', entityTypes: ['STAFF', 'COURSE'] },
    { name: 'position', displayName: 'Position', dataType: 'STRING', category: 'EMPLOYMENT', entityTypes: ['STAFF'] },
    { name: 'office', displayName: 'Office', dataType: 'STRING', category: 'FACILITY', entityTypes: ['STAFF'] },
    { name: 'officeHours', displayName: 'Office Hours', dataType: 'STRING', category: 'SCHEDULE', entityTypes: ['STAFF'] },
    { name: 'specialization', displayName: 'Specialization', dataType: 'STRING', category: 'ACADEMIC', entityTypes: ['STAFF'] },
    { name: 'hireDate', displayName: 'Hire Date', dataType: 'DATE', category: 'EMPLOYMENT', entityTypes: ['STAFF'] },

    // ===== COURSE ATTRIBUTES =====
    { name: 'courseCode', displayName: 'Course Code', dataType: 'STRING', category: 'ACADEMIC', entityTypes: ['COURSE'], isRequired: true },
    { name: 'credits', displayName: 'Credits', dataType: 'NUMBER', category: 'ACADEMIC', entityTypes: ['COURSE'] },
    { name: 'courseType', displayName: 'Course Type', dataType: 'STRING', category: 'ACADEMIC', entityTypes: ['COURSE'] },
    { name: 'capacity', displayName: 'Capacity', dataType: 'NUMBER', category: 'ACADEMIC', entityTypes: ['COURSE'] },
    { name: 'room', displayName: 'Room', dataType: 'STRING', category: 'FACILITY', entityTypes: ['COURSE'] },
    { name: 'schedule', displayName: 'Schedule', dataType: 'TEXT', category: 'SCHEDULE', entityTypes: ['COURSE'] },
    { name: 'semester', displayName: 'Semester', dataType: 'STRING', category: 'ACADEMIC', entityTypes: ['COURSE'] },
    { name: 'courseContent', displayName: 'Course Content', dataType: 'TEXT', category: 'ACADEMIC', entityTypes: ['COURSE'] },
    { name: 'hasLecture', displayName: 'Has Lecture', dataType: 'BOOLEAN', category: 'ACADEMIC', entityTypes: ['COURSE'] },
    { name: 'hasTutorial', displayName: 'Has Tutorial', dataType: 'BOOLEAN', category: 'ACADEMIC', entityTypes: ['COURSE'] },
    { name: 'hasLab', displayName: 'Has Lab', dataType: 'BOOLEAN', category: 'ACADEMIC', entityTypes: ['COURSE'] },

    // ===== DEPARTMENT ATTRIBUTES =====
    { name: 'head', displayName: 'Department Head', dataType: 'STRING', category: 'EMPLOYMENT', entityTypes: ['DEPARTMENT'] },
    { name: 'building', displayName: 'Building', dataType: 'STRING', category: 'FACILITY', entityTypes: ['DEPARTMENT', 'ROOM'] },
    { name: 'establishedYear', displayName: 'Established Year', dataType: 'NUMBER', category: 'SYSTEM', entityTypes: ['DEPARTMENT'] },
    { name: 'website', displayName: 'Website', dataType: 'URL', category: 'CONTACT', entityTypes: ['DEPARTMENT'] },

    // ===== FACILITY ATTRIBUTES (Building/Room) =====
    { name: 'floors', displayName: 'Number of Floors', dataType: 'NUMBER', category: 'FACILITY', entityTypes: ['BUILDING'] },
    { name: 'floor', displayName: 'Floor', dataType: 'NUMBER', category: 'FACILITY', entityTypes: ['ROOM'] },
    { name: 'roomType', displayName: 'Room Type', dataType: 'STRING', category: 'FACILITY', entityTypes: ['ROOM'] },
    { name: 'equipment', displayName: 'Equipment', dataType: 'TEXT', category: 'FACILITY', entityTypes: ['ROOM'] },

    // ===== EVENT ATTRIBUTES =====
    { name: 'eventDate', displayName: 'Event Date', dataType: 'DATE', category: 'SCHEDULE', entityTypes: ['EVENT'] },
    { name: 'eventTime', displayName: 'Event Time', dataType: 'STRING', category: 'SCHEDULE', entityTypes: ['EVENT'] },
    { name: 'eventLocation', displayName: 'Event Location', dataType: 'STRING', category: 'FACILITY', entityTypes: ['EVENT'] },
    { name: 'eventType', displayName: 'Event Type', dataType: 'STRING', category: 'SYSTEM', entityTypes: ['EVENT'] },

    // ===== ANNOUNCEMENT ATTRIBUTES =====
    { name: 'priority', displayName: 'Priority', dataType: 'STRING', category: 'SYSTEM', entityTypes: ['ANNOUNCEMENT'] },
    { name: 'targetAudience', displayName: 'Target Audience', dataType: 'STRING', category: 'SYSTEM', entityTypes: ['ANNOUNCEMENT'] },
    { name: 'expiryDate', displayName: 'Expiry Date', dataType: 'DATE', category: 'SCHEDULE', entityTypes: ['ANNOUNCEMENT'] },

    // ===== COURSE CONTENT ATTRIBUTES =====
    { name: 'dueDate', displayName: 'Due Date', dataType: 'DATETIME', category: 'SCHEDULE', entityTypes: ['COURSE_CONTENT'] },
    { name: 'maxScore', displayName: 'Maximum Score', dataType: 'NUMBER', category: 'ACADEMIC', entityTypes: ['COURSE_CONTENT'] },
    { name: 'weight', displayName: 'Weight', dataType: 'NUMBER', category: 'ACADEMIC', entityTypes: ['COURSE_CONTENT'] },
    { name: 'instructions', displayName: 'Instructions', dataType: 'TEXT', category: 'ACADEMIC', entityTypes: ['COURSE_CONTENT'] },

    // ===== PARENT ATTRIBUTES =====
    { name: 'relationship', displayName: 'Relationship', dataType: 'STRING', category: 'PERSONAL', entityTypes: ['PARENT'] },
    { name: 'occupation', displayName: 'Occupation', dataType: 'STRING', category: 'EMPLOYMENT', entityTypes: ['PARENT'] },
];

async function seedAttributes() {
    console.log('🌱 Seeding EAV attributes...');

    for (const attr of attributes) {
        await prisma.attribute.upsert({
            where: { name: attr.name },
            update: {
                displayName: attr.displayName,
                dataType: attr.dataType,
                category: attr.category,
                entityTypes: JSON.stringify(attr.entityTypes),
                isRequired: attr.isRequired || false,
                description: attr.description || null,
            },
            create: {
                name: attr.name,
                displayName: attr.displayName,
                dataType: attr.dataType,
                category: attr.category,
                entityTypes: JSON.stringify(attr.entityTypes),
                isRequired: attr.isRequired || false,
                description: attr.description || null,
            },
        });
        console.log(`  ✓ ${attr.name}`);
    }

    console.log(`\n✅ Seeded ${attributes.length} attributes`);
}

async function main() {
    console.log('🚀 Starting EAV seed...\n');

    await seedAttributes();

    console.log('\n🎉 EAV seed completed successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
