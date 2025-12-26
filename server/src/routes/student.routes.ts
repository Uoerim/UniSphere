import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import type { AttributeDataType } from "@prisma/client";

export const studentRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "shhhhhhhh";

// Middleware to verify JWT token
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
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

    if (!account) {
      return res.status(401).json({ error: "User not found" });
    }

    (req as any).user = account;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

// Middleware to verify admin role
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ error: "Admin access required" });
  }
  
  next();
};

// Helper function to map JS types to Prisma AttributeDataType enum
function getAttributeDataType(value: any): AttributeDataType {
  if (typeof value === "string") return "STRING";
  if (typeof value === "number") return "NUMBER";
  if (typeof value === "boolean") return "BOOLEAN";
  if (value instanceof Date) return "DATE";
  return "STRING";
}

function toValueCreate(v: any) {
  if (typeof v === "string") return { valueString: v };
  if (typeof v === "number") return { valueNumber: v };
  if (typeof v === "boolean") return { valueBool: v };
  if (v instanceof Date) return { valueDate: v };
  return { valueString: String(v) };
}

function toValueUpdate(v: any) {
  return { 
    valueString: null, 
    valueNumber: null, 
    valueBool: null, 
    valueDate: null, 
    valueDateTime: null,
    valueText: null,
    ...toValueCreate(v) 
  };
}

// Helper to normalize entity to object with attributes
function normalizeEntity(entity: any) {
  return {
    id: entity.id,
    type: entity.type,
    name: entity.name,
    code: entity.code,
    description: entity.description,
    isActive: entity.isActive,
    createdAt: entity.createdAt,
    ...Object.fromEntries(
      entity.values.map((v: any) => [
        v.attribute.name,
        v.valueString ?? v.valueNumber ?? v.valueBool ?? v.valueDate ?? v.valueDateTime ?? v.valueText,
      ])
    ),
  };
}

// Helper to extract course name from entity (try multiple field names)
function extractCourseName(entity: any): string {
  const normalized = normalizeEntity(entity);
  return (
    normalized.name ||
    normalized.courseName ||
    normalized.title ||
    normalized.displayName ||
    normalized.course_name ||
    'Unnamed Course'
  );
}

// Helper to extract course code from entity (try multiple field names)
function extractCourseCode(entity: any): string {
  const normalized = normalizeEntity(entity);
  return (
    normalized.code ||
    normalized.courseCode ||
    normalized.course_code ||
    normalized.shortCode ||
    'N/A'
  );
}

/**
 * GET /api/students
 * Get all students with their account info and entity attributes
 */
studentRouter.get("/", authenticateToken, requireAdmin, async (_req, res) => {
  try {
    // Get all accounts with STUDENT role
    const accounts = await prisma.account.findMany({
      where: { role: "STUDENT" },
      include: { 
        entity: { 
          include: { 
            values: { include: { attribute: true } },
            relationsFrom: {
              where: { relationType: "ENROLLED_IN", isActive: true },
              include: { 
                toEntity: { 
                  include: { values: { include: { attribute: true } } } 
                } 
              }
            }
          } 
        } 
      },
      orderBy: { createdAt: 'desc' }
    });

    const students = accounts.map((account: any) => {
      const entity = account.entity;
      const attrs: Record<string, any> = {};
      
      if (entity) {
        entity.values.forEach((v: any) => {
          attrs[v.attribute.name] = v.valueString ?? v.valueNumber ?? v.valueBool ?? v.valueDate ?? v.valueDateTime ?? v.valueText;
        });
      }

      // Get enrolled courses
      const enrolledCourses = entity?.relationsFrom?.map((rel: any) => {
        const course = normalizeEntity(rel.toEntity);
        const metadata = rel.metadata ? JSON.parse(rel.metadata) : {};
        return {
          ...course,
          name: extractCourseName(rel.toEntity),
          courseName: extractCourseName(rel.toEntity),
          code: extractCourseCode(rel.toEntity),
          courseCode: extractCourseCode(rel.toEntity),
          enrollmentId: rel.id,
          grade: metadata.grade,
          attendance: metadata.attendance,
          enrolledAt: rel.startDate || rel.createdAt,
          status: rel.isActive ? 'active' : 'dropped'
        };
      }) || [];

      return {
        id: account.id,
        email: account.email,
        role: account.role,
        isActive: account.isActive,
        createdAt: account.createdAt,
        mustChangePassword: account.mustChangePassword,
        tempPassword: account.tempPassword,
        entityId: entity?.id,
        firstName: attrs.firstName || '',
        lastName: attrs.lastName || '',
        studentId: attrs.studentId || '',
        phone: attrs.phone || '',
        phoneCountry: attrs.phoneCountry || '+1',
        address: attrs.address || '',
        city: attrs.city || '',
        country: attrs.country || '',
        dateOfBirth: attrs.dateOfBirth || '',
        gender: attrs.gender || '',
        nationality: attrs.nationality || '',
        enrollmentDate: attrs.enrollmentDate || '',
        enrollmentStatus: attrs.enrollmentStatus || 'Active',
        program: attrs.program || '',
        major: attrs.major || '',
        minor: attrs.minor || '',
        year: attrs.year || '',
        semester: attrs.semester || '',
        gpa: attrs.gpa || '',
        credits: attrs.credits || 0,
        advisor: attrs.advisor || '',
        scholarshipStatus: attrs.scholarshipStatus || 'None',
        scholarshipAmount: attrs.scholarshipAmount || 0,
        emergencyContact: attrs.emergencyContact || '',
        emergencyPhone: attrs.emergencyPhone || '',
        notes: attrs.notes || '',
        enrolledCourses,
        coursesCount: enrolledCourses.length
      };
    });

    res.json(students);
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

/**
 * GET /api/students/me
 * Return the current student's profile (self-access), including entity attributes such as gpa.
 */
studentRouter.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== "STUDENT") {
      return res.status(403).json({ error: "Student access required" });
    }

    const account = await prisma.account.findUnique({
      where: { id: user.id },
      include: {
        entity: {
          include: {
            values: { include: { attribute: true } },
          },
        },
      },
    });

    if (!account) {
      return res.status(404).json({ error: "Student not found" });
    }

    const entity = account.entity;
    const attrs: Record<string, any> = {};

    if (entity) {
      entity.values.forEach((v: any) => {
        attrs[v.attribute.name] =
          v.valueString ?? v.valueNumber ?? v.valueBool ?? v.valueDate ?? v.valueDateTime ?? v.valueText;
      });
    }

    return res.json({
      id: account.id,
      email: account.email,
      role: account.role,
      entityId: entity?.id,
      gpa: attrs.gpa ?? null,
      program: attrs.program ?? null,
      major: attrs.major ?? null,
      year: attrs.year ?? null,
    });
  } catch (error) {
    console.error("Failed to fetch student self profile:", error);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

/**
 * GET /api/students/me/courses
 * Return the current student's enrolled courses with grade/attendance/status (self-access)
 */
studentRouter.get("/me/courses", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    if (!user || user.role !== "STUDENT") {
      return res.status(403).json({ error: "Student access required" });
    }

    const account = await prisma.account.findUnique({
      where: { id: user.id },
      include: {
        entity: {
          include: {
            relationsFrom: {
              where: { relationType: "ENROLLED_IN" },
              include: {
                toEntity: {
                  include: { values: { include: { attribute: true } } }
                }
              }
            }
          }
        }
      }
    });

    const entity = account?.entity;
    if (!entity) {
      return res.json([]);
    }

    const enrollments = entity.relationsFrom?.filter((rel: any) => rel.relationType === "ENROLLED_IN") || [];
    const courseIds = enrollments.map((rel: any) => rel.toEntityId);

    // Fetch department relations for courses
    const belongsToRelations = await prisma.entityRelation.findMany({
      where: {
        relationType: 'BELONGS_TO',
        fromEntityId: { in: courseIds }
      },
      include: {
        toEntity: {
          include: {
            values: { include: { attribute: true } }
          }
        }
      }
    });

    const courseDeptMap = new Map<string, any>();
    belongsToRelations.forEach(rel => {
      const deptAttrs: Record<string, any> = {};
      rel.toEntity.values.forEach((v: any) => {
        deptAttrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
      });
      courseDeptMap.set(rel.fromEntityId, {
        id: rel.toEntityId,
        name: rel.toEntity.name || deptAttrs.departmentName || deptAttrs.name || 'Unknown Department',
        code: deptAttrs.departmentCode || deptAttrs.code,
        ...deptAttrs
      });
    });

    const courses = enrollments.map((rel: any) => {
      const course = normalizeEntity(rel.toEntity);
      const metadata = rel.metadata ? JSON.parse(rel.metadata) : {};
      const department = courseDeptMap.get(rel.toEntityId);

      return {
        ...course,
        name: extractCourseName(rel.toEntity),
        courseName: extractCourseName(rel.toEntity),
        code: extractCourseCode(rel.toEntity),
        courseCode: extractCourseCode(rel.toEntity),
        enrollmentId: rel.id,
        grade: metadata.grade ?? 'N/A',
        attendance: metadata.attendance ?? 0,
        enrolledAt: rel.startDate || rel.createdAt,
        status: rel.isActive ? 'active' : 'dropped',
        department: department?.name,
        departmentCode: department?.code,
      };
    });

    res.json(courses);
  } catch (error) {
    console.error("Get my courses error:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

/**
 * GET /api/students/:id
 * Get a single student with full details
 */
studentRouter.get("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;

    const account = await prisma.account.findFirst({
      where: { id, role: "STUDENT" },
      include: { 
        entity: { 
          include: { 
            values: { include: { attribute: true } },
            relationsFrom: {
              include: { 
                toEntity: { 
                  include: { values: { include: { attribute: true } } } 
                } 
              }
            }
          } 
        } 
      }
    });

    if (!account) {
      return res.status(404).json({ error: "Student not found" });
    }

    const entity = account.entity;
    const attrs: Record<string, any> = {};
    
    if (entity) {
      entity.values.forEach((v: any) => {
        attrs[v.attribute.name] = v.valueString ?? v.valueNumber ?? v.valueBool ?? v.valueDate ?? v.valueDateTime ?? v.valueText;
      });
    }

    // Get enrolled courses with details
    const enrolledCourses = entity?.relationsFrom
      ?.filter((rel: any) => rel.relationType === "ENROLLED_IN")
      ?.map((rel: any) => {
        const course = normalizeEntity(rel.toEntity);
        const metadata = rel.metadata ? JSON.parse(rel.metadata) : {};
        return {
          ...course,
          name: extractCourseName(rel.toEntity),
          courseName: extractCourseName(rel.toEntity),
          code: extractCourseCode(rel.toEntity),
          courseCode: extractCourseCode(rel.toEntity),
          enrollmentId: rel.id,
          grade: metadata.grade,
          attendance: metadata.attendance,
          enrolledAt: rel.startDate || rel.createdAt,
          status: rel.isActive ? 'active' : 'dropped'
        };
      }) || [];

    res.json({
      id: account.id,
      email: account.email,
      role: account.role,
      isActive: account.isActive,
      createdAt: account.createdAt,
      entityId: entity?.id,
      ...attrs,
      enrolledCourses
    });
  } catch (error) {
    console.error("Get student error:", error);
    res.status(500).json({ error: "Failed to fetch student" });
  }
});

/**
 * POST /api/students
 * Create a new student (account + entity)
 */
studentRouter.post("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, attributes = {} } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if account exists
    const existingAccount = await prisma.account.findUnique({ where: { email } });
    if (existingAccount) {
      return res.status(400).json({ error: "Account with this email already exists" });
    }

    // Generate random password
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create entity first
    const entity = await prisma.entity.create({
      data: { type: "STUDENT" }
    });

    // Create account linked to entity
    const account = await prisma.account.create({
      data: {
        email,
        password: hashedPassword,
        role: "STUDENT",
        mustChangePassword: true,
        tempPassword: password,
        entityId: entity.id
      }
    });

    // Store email as attribute
    attributes.email = email;

    // Create attribute values
    for (const [name, raw] of Object.entries(attributes)) {
      const dataType = getAttributeDataType(raw);

      const attr = await prisma.attribute.upsert({
        where: { name },
        update: {},
        create: { 
          name, 
          displayName: name,
          dataType,
          category: "PERSONAL",
          entityTypes: JSON.stringify(["STUDENT"])
        },
      });

      await prisma.value.upsert({
        where: {
          entityId_attributeId: { entityId: entity.id, attributeId: attr.id },
        },
        update: toValueUpdate(raw),
        create: {
          entityId: entity.id,
          attributeId: attr.id,
          ...toValueCreate(raw),
        },
      });
    }

    res.status(201).json({ 
      id: account.id, 
      entityId: entity.id,
      email,
      tempPassword: password 
    });
  } catch (error) {
    console.error("Create student error:", error);
    res.status(500).json({ error: "Failed to create student" });
  }
});

/**
 * PATCH /api/students/:id
 * Update student attributes
 */
studentRouter.patch("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { attributes = {} } = req.body;

    // Find account
    const account = await prisma.account.findFirst({
      where: { id, role: "STUDENT" },
      include: { entity: true }
    }) as any;

    if (!account) {
      return res.status(404).json({ error: "Student not found" });
    }

    let entity = account.entity;

    // Create entity if doesn't exist
    if (!entity) {
      entity = await prisma.entity.create({
        data: { type: "STUDENT" }
      });

      await prisma.account.update({
        where: { id: account.id },
        data: { entityId: entity.id }
      });
    }

    // Update attributes
    for (const [name, raw] of Object.entries(attributes)) {
      const attr = await prisma.attribute.upsert({
        where: { name },
        update: {},
        create: { 
          name, 
          displayName: name,
          dataType: getAttributeDataType(raw),
          category: "PERSONAL",
          entityTypes: JSON.stringify(["STUDENT"])
        },
      });

      await prisma.value.upsert({
        where: { entityId_attributeId: { entityId: entity.id, attributeId: attr.id } },
        update: toValueUpdate(raw),
        create: { entityId: entity.id, attributeId: attr.id, ...toValueCreate(raw) },
      });
    }

    res.json({ ok: true, entityId: entity.id });
  } catch (error) {
    console.error("Update student error:", error);
    res.status(500).json({ error: "Failed to update student" });
  }
});

/**
 * DELETE /api/students/:id
 * Delete a student (account and entity)
 */
studentRouter.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;

    const account = await prisma.account.findFirst({
      where: { id, role: "STUDENT" },
      include: { entity: true }
    }) as any;

    if (!account) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Delete entity and values if exists
    if (account.entity) {
      await prisma.entityRelation.deleteMany({ 
        where: { 
          OR: [
            { fromEntityId: account.entity.id },
            { toEntityId: account.entity.id }
          ]
        }
      });
      await prisma.value.deleteMany({ where: { entityId: account.entity.id } });
      await prisma.entity.delete({ where: { id: account.entity.id } });
    }

    // Delete account
    await prisma.account.delete({ where: { id } });

    res.json({ ok: true });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({ error: "Failed to delete student" });
  }
});

/**
 * GET /api/students/:id/courses
 * Get all courses a student is enrolled in
 */
studentRouter.get("/:id/courses", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;

    const account = await prisma.account.findFirst({
      where: { id, role: "STUDENT" },
      include: { entity: true }
    }) as any;

    if (!account || !account.entity) {
      return res.json([]);
    }

    const enrollments = await prisma.entityRelation.findMany({
      where: { 
        fromEntityId: account.entity.id,
        relationType: "ENROLLED_IN"
      },
      include: {
        toEntity: {
          include: { values: { include: { attribute: true } } }
        }
      }
    });

    const courses = enrollments.map((rel: any) => {
      const course = normalizeEntity(rel.toEntity);
      const metadata = rel.metadata ? JSON.parse(rel.metadata) : {};
      return {
        ...course,
        enrollmentId: rel.id,
        grade: metadata.grade || 'N/A',
        attendance: metadata.attendance || 0,
        enrolledAt: rel.startDate || rel.createdAt,
        status: rel.isActive ? 'active' : 'dropped'
      };
    });

    res.json(courses);
  } catch (error) {
    console.error("Get student courses error:", error);
    res.status(500).json({ error: "Failed to fetch student courses" });
  }
});

/**
 * POST /api/students/:id/courses
 * Enroll student in a course
 */
studentRouter.post("/:id/courses", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { courseId, grade, attendance } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: "Course ID is required" });
    }

    const account = await prisma.account.findFirst({
      where: { id, role: "STUDENT" },
      include: { entity: true }
    }) as any;

    if (!account) {
      return res.status(404).json({ error: "Student not found" });
    }

    let entity = account.entity;
    if (!entity) {
      entity = await prisma.entity.create({
        data: { type: "STUDENT" }
      });
      await prisma.account.update({
        where: { id: account.id },
        data: { entityId: entity.id }
      });
    }

    // Check if course entity exists
    const course = await prisma.entity.findFirst({
      where: { id: courseId, type: "COURSE" }
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.entityRelation.findFirst({
      where: {
        fromEntityId: entity.id,
        toEntityId: courseId,
        relationType: "ENROLLED_IN"
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({ error: "Student is already enrolled in this course" });
    }

    // Create enrollment
    const enrollment = await prisma.entityRelation.create({
      data: {
        fromEntityId: entity.id,
        toEntityId: courseId,
        relationType: "ENROLLED_IN",
        isActive: true,
        startDate: new Date(),
        metadata: JSON.stringify({ grade: grade || 'N/A', attendance: attendance || 0 })
      }
    });

    res.status(201).json({ ok: true, enrollmentId: enrollment.id });
  } catch (error) {
    console.error("Enroll student error:", error);
    res.status(500).json({ error: "Failed to enroll student" });
  }
});

/**
 * PATCH /api/students/:id/courses/:enrollmentId
 * Update enrollment (grade, attendance, status)
 */
studentRouter.patch("/:id/courses/:enrollmentId", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const enrollmentId = req.params.enrollmentId as string;
    const { grade, attendance, isActive } = req.body;

    const enrollment = await prisma.entityRelation.findFirst({
      where: { id: enrollmentId }
    });

    if (!enrollment) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    const currentMetadata = enrollment.metadata ? JSON.parse(enrollment.metadata) : {};
    const newMetadata = {
      ...currentMetadata,
      ...(grade !== undefined && { grade }),
      ...(attendance !== undefined && { attendance })
    };

    await prisma.entityRelation.updateMany({
      where: { id: enrollmentId },
      data: {
        metadata: JSON.stringify(newMetadata),
        ...(isActive !== undefined && { isActive })
      }
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("Update enrollment error:", error);
    res.status(500).json({ error: "Failed to update enrollment" });
  }
});

/**
 * DELETE /api/students/:id/courses/:enrollmentId
 * Remove student from a course
 */
studentRouter.delete("/:id/courses/:enrollmentId", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const enrollmentId = req.params.enrollmentId as string;

    await prisma.entityRelation.deleteMany({
      where: { id: enrollmentId }
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("Remove enrollment error:", error);
    res.status(500).json({ error: "Failed to remove enrollment" });
  }
});

/**
 * GET /api/students/available-courses
 * Get all available courses for enrollment
 */
studentRouter.get("/available/courses", authenticateToken, requireAdmin, async (_req, res) => {
  try {
    const courses = await prisma.entity.findMany({
      where: { type: "COURSE", isActive: true },
      include: { values: { include: { attribute: true } } }
    });

    const normalizedCourses = courses.map(course => normalizeEntity(course));

    res.json(normalizedCourses);
  } catch (error) {
    console.error("Get available courses error:", error);
    res.status(500).json({ error: "Failed to fetch available courses" });
  }
});
