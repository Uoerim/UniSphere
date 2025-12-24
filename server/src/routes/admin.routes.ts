import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";

export const adminRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "shhhhhhhh";

// Middleware to verify JWT token and admin role
const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ error: "No token provided" });
        }

        const token = authHeader.substring(7);
        let decoded: any;

        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return res.status(401).json({ error: "Invalid token" });
        }

        const account = await prisma.account.findUnique({
            where: { id: decoded.userId }
        });

        if (!account || account.role !== 'ADMIN') {
            return res.status(403).json({ error: "Admin access required" });
        }

        (req as any).user = account;
        next();
    } catch (error) {
        console.error("Authentication error:", error);
        res.status(500).json({ error: "Authentication failed" });
    }
};

// Predefined attributes for all entity types
const predefinedAttributes = [
    // ===== STUDENT ATTRIBUTES =====
    { name: 'firstName', displayName: 'First Name', dataType: 'STRING' as const, category: 'PERSONAL' as const, entityTypes: ['STUDENT', 'STAFF', 'PARENT'], isRequired: true },
    { name: 'lastName', displayName: 'Last Name', dataType: 'STRING' as const, category: 'PERSONAL' as const, entityTypes: ['STUDENT', 'STAFF', 'PARENT'], isRequired: true },
    { name: 'email', displayName: 'Email', dataType: 'EMAIL' as const, category: 'CONTACT' as const, entityTypes: ['STUDENT', 'STAFF', 'PARENT'], isRequired: true },
    { name: 'phone', displayName: 'Phone', dataType: 'PHONE' as const, category: 'CONTACT' as const, entityTypes: ['STUDENT', 'STAFF', 'PARENT'] },
    { name: 'address', displayName: 'Address', dataType: 'TEXT' as const, category: 'CONTACT' as const, entityTypes: ['STUDENT', 'STAFF', 'PARENT'] },
    { name: 'dateOfBirth', displayName: 'Date of Birth', dataType: 'DATE' as const, category: 'PERSONAL' as const, entityTypes: ['STUDENT', 'STAFF', 'PARENT'] },
    { name: 'studentId', displayName: 'Student ID', dataType: 'STRING' as const, category: 'ACADEMIC' as const, entityTypes: ['STUDENT'], isRequired: true },
    { name: 'program', displayName: 'Program', dataType: 'STRING' as const, category: 'ACADEMIC' as const, entityTypes: ['STUDENT'] },
    { name: 'year', displayName: 'Year', dataType: 'STRING' as const, category: 'ACADEMIC' as const, entityTypes: ['STUDENT'] },
    { name: 'gpa', displayName: 'GPA', dataType: 'NUMBER' as const, category: 'ACADEMIC' as const, entityTypes: ['STUDENT'] },
    { name: 'advisor', displayName: 'Advisor', dataType: 'STRING' as const, category: 'ACADEMIC' as const, entityTypes: ['STUDENT'] },
    { name: 'emergencyContact', displayName: 'Emergency Contact', dataType: 'STRING' as const, category: 'CONTACT' as const, entityTypes: ['STUDENT'] },
    { name: 'emergencyPhone', displayName: 'Emergency Phone', dataType: 'PHONE' as const, category: 'CONTACT' as const, entityTypes: ['STUDENT'] },
    { name: 'enrollmentDate', displayName: 'Enrollment Date', dataType: 'DATE' as const, category: 'ACADEMIC' as const, entityTypes: ['STUDENT'] },

    // ===== STAFF ATTRIBUTES =====
    { name: 'department', displayName: 'Department', dataType: 'STRING' as const, category: 'EMPLOYMENT' as const, entityTypes: ['STAFF', 'COURSE'] },
    { name: 'position', displayName: 'Position', dataType: 'STRING' as const, category: 'EMPLOYMENT' as const, entityTypes: ['STAFF'] },
    { name: 'office', displayName: 'Office', dataType: 'STRING' as const, category: 'FACILITY' as const, entityTypes: ['STAFF'] },
    { name: 'officeHours', displayName: 'Office Hours', dataType: 'STRING' as const, category: 'SCHEDULE' as const, entityTypes: ['STAFF'] },
    { name: 'specialization', displayName: 'Specialization', dataType: 'STRING' as const, category: 'ACADEMIC' as const, entityTypes: ['STAFF'] },
    { name: 'hireDate', displayName: 'Hire Date', dataType: 'DATE' as const, category: 'EMPLOYMENT' as const, entityTypes: ['STAFF'] },

    // ===== COURSE ATTRIBUTES =====
    { name: 'courseCode', displayName: 'Course Code', dataType: 'STRING' as const, category: 'ACADEMIC' as const, entityTypes: ['COURSE'], isRequired: true },
    { name: 'credits', displayName: 'Credits', dataType: 'NUMBER' as const, category: 'ACADEMIC' as const, entityTypes: ['COURSE'] },
    { name: 'courseType', displayName: 'Course Type', dataType: 'STRING' as const, category: 'ACADEMIC' as const, entityTypes: ['COURSE'] },
    { name: 'capacity', displayName: 'Capacity', dataType: 'NUMBER' as const, category: 'ACADEMIC' as const, entityTypes: ['COURSE'] },
    { name: 'room', displayName: 'Room', dataType: 'STRING' as const, category: 'FACILITY' as const, entityTypes: ['COURSE'] },
    { name: 'schedule', displayName: 'Schedule', dataType: 'TEXT' as const, category: 'SCHEDULE' as const, entityTypes: ['COURSE'] },
    { name: 'semester', displayName: 'Semester', dataType: 'STRING' as const, category: 'ACADEMIC' as const, entityTypes: ['COURSE'] },
    { name: 'courseContent', displayName: 'Course Content', dataType: 'TEXT' as const, category: 'ACADEMIC' as const, entityTypes: ['COURSE'] },
    { name: 'hasLecture', displayName: 'Has Lecture', dataType: 'BOOLEAN' as const, category: 'ACADEMIC' as const, entityTypes: ['COURSE'] },
    { name: 'hasTutorial', displayName: 'Has Tutorial', dataType: 'BOOLEAN' as const, category: 'ACADEMIC' as const, entityTypes: ['COURSE'] },
    { name: 'hasLab', displayName: 'Has Lab', dataType: 'BOOLEAN' as const, category: 'ACADEMIC' as const, entityTypes: ['COURSE'] },

    // ===== DEPARTMENT ATTRIBUTES =====
    { name: 'head', displayName: 'Department Head', dataType: 'STRING' as const, category: 'EMPLOYMENT' as const, entityTypes: ['DEPARTMENT'] },
    { name: 'building', displayName: 'Building', dataType: 'STRING' as const, category: 'FACILITY' as const, entityTypes: ['DEPARTMENT', 'ROOM'] },
    { name: 'establishedYear', displayName: 'Established Year', dataType: 'NUMBER' as const, category: 'SYSTEM' as const, entityTypes: ['DEPARTMENT'] },
    { name: 'website', displayName: 'Website', dataType: 'URL' as const, category: 'CONTACT' as const, entityTypes: ['DEPARTMENT'] },

    // ===== FACILITY ATTRIBUTES =====
    { name: 'floors', displayName: 'Number of Floors', dataType: 'NUMBER' as const, category: 'FACILITY' as const, entityTypes: ['BUILDING'] },
    { name: 'floor', displayName: 'Floor', dataType: 'NUMBER' as const, category: 'FACILITY' as const, entityTypes: ['ROOM'] },
    { name: 'roomType', displayName: 'Room Type', dataType: 'STRING' as const, category: 'FACILITY' as const, entityTypes: ['ROOM'] },
    { name: 'equipment', displayName: 'Equipment', dataType: 'TEXT' as const, category: 'FACILITY' as const, entityTypes: ['ROOM'] },

    // ===== EVENT ATTRIBUTES =====
    { name: 'eventDate', displayName: 'Event Date', dataType: 'DATE' as const, category: 'SCHEDULE' as const, entityTypes: ['EVENT'] },
    { name: 'eventTime', displayName: 'Event Time', dataType: 'STRING' as const, category: 'SCHEDULE' as const, entityTypes: ['EVENT'] },
    { name: 'eventLocation', displayName: 'Event Location', dataType: 'STRING' as const, category: 'FACILITY' as const, entityTypes: ['EVENT'] },
    { name: 'eventType', displayName: 'Event Type', dataType: 'STRING' as const, category: 'SYSTEM' as const, entityTypes: ['EVENT'] },

    // ===== ANNOUNCEMENT ATTRIBUTES =====
    { name: 'priority', displayName: 'Priority', dataType: 'STRING' as const, category: 'SYSTEM' as const, entityTypes: ['ANNOUNCEMENT'] },
    { name: 'targetAudience', displayName: 'Target Audience', dataType: 'STRING' as const, category: 'SYSTEM' as const, entityTypes: ['ANNOUNCEMENT'] },
    { name: 'expiryDate', displayName: 'Expiry Date', dataType: 'DATE' as const, category: 'SCHEDULE' as const, entityTypes: ['ANNOUNCEMENT'] },

    // ===== COURSE CONTENT ATTRIBUTES =====
    { name: 'dueDate', displayName: 'Due Date', dataType: 'DATETIME' as const, category: 'SCHEDULE' as const, entityTypes: ['COURSE_CONTENT'] },
    { name: 'maxScore', displayName: 'Maximum Score', dataType: 'NUMBER' as const, category: 'ACADEMIC' as const, entityTypes: ['COURSE_CONTENT'] },
    { name: 'weight', displayName: 'Weight', dataType: 'NUMBER' as const, category: 'ACADEMIC' as const, entityTypes: ['COURSE_CONTENT'] },
    { name: 'instructions', displayName: 'Instructions', dataType: 'TEXT' as const, category: 'ACADEMIC' as const, entityTypes: ['COURSE_CONTENT'] },

    // ===== PARENT ATTRIBUTES =====
    { name: 'relationship', displayName: 'Relationship', dataType: 'STRING' as const, category: 'PERSONAL' as const, entityTypes: ['PARENT'] },
    { name: 'occupation', displayName: 'Occupation', dataType: 'STRING' as const, category: 'EMPLOYMENT' as const, entityTypes: ['PARENT'] },
];

/**
 * POST /api/admin/seed-eav
 * Seed the database with predefined EAV attributes (admin only)
 */
adminRouter.post("/seed-eav", authenticateAdmin, async (_req, res) => {
    try {
        console.log('🌱 Seeding EAV attributes...');
        const seeded: string[] = [];

        for (const attr of predefinedAttributes) {
            await prisma.attribute.upsert({
                where: { name: attr.name },
                update: {
                    displayName: attr.displayName,
                    dataType: attr.dataType,
                    category: attr.category,
                    entityTypes: JSON.stringify(attr.entityTypes),
                    isRequired: attr.isRequired || false,
                },
                create: {
                    name: attr.name,
                    displayName: attr.displayName,
                    dataType: attr.dataType,
                    category: attr.category,
                    entityTypes: JSON.stringify(attr.entityTypes),
                    isRequired: attr.isRequired || false,
                },
            });
            seeded.push(attr.name);
        }

        console.log(`✅ Seeded ${seeded.length} attributes`);
        res.json({
            success: true,
            message: `Successfully seeded ${seeded.length} attributes`,
            attributes: seeded
        });
    } catch (error) {
        console.error('❌ Seed failed:', error);
        res.status(500).json({ error: "Failed to seed EAV attributes" });
    }
});

/**
 * GET /api/admin/attributes
 * Get all predefined attributes
 */
adminRouter.get("/attributes", authenticateAdmin, async (_req, res) => {
    try {
        const attributes = await prisma.attribute.findMany({
            orderBy: [
                { category: 'asc' },
                { name: 'asc' }
            ]
        });
        res.json(attributes);
    } catch (error) {
        console.error('Get attributes error:', error);
        res.status(500).json({ error: "Failed to fetch attributes" });
    }
});

/**
 * GET /api/admin/stats
 * Get EAV system statistics
 */
adminRouter.get("/stats", authenticateAdmin, async (_req, res) => {
    try {
        const [
            entityCounts,
            attributeCount,
            valueCount,
            relationCount
        ] = await Promise.all([
            prisma.entity.groupBy({
                by: ['type'],
                _count: true
            }),
            prisma.attribute.count(),
            prisma.value.count(),
            prisma.entityRelation.count()
        ]);

        res.json({
            entities: Object.fromEntries(entityCounts.map(e => [e.type, e._count])),
            totalEntities: entityCounts.reduce((sum, e) => sum + e._count, 0),
            attributes: attributeCount,
            values: valueCount,
            relations: relationCount
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ error: "Failed to fetch stats" });
    }
});
