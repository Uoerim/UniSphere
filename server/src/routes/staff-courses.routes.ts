import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import type { Request, Response, NextFunction } from "express";

export const staffCoursesRouter = Router();

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
    } catch {
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

// Middleware to verify admin or staff role
const requireAdminOrStaff = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user || (user.role !== 'ADMIN' && user.role !== 'STAFF')) {
    return res.status(403).json({ error: "Admin or Staff access required" });
  }
  
  next();
};

/**
 * GET /api/staff-courses/:staffId
 * Get all courses assigned to a staff member
 */
staffCoursesRouter.get("/:staffId", authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { staffId } = req.params;

    // Find staff entity
    const staffEntity = await prisma.entity.findFirst({
      where: { 
        id: staffId,
        type: "STAFF"
      }
    });

    if (!staffEntity) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Get course relations for this staff member
    const courseRelations = await prisma.entityRelation.findMany({
      where: {
        fromEntityId: staffId,
        relationType: "TEACHES",
        isActive: true
      },
      include: {
        toEntity: {
          include: {
            values: {
              include: { attribute: true }
            }
          }
        }
      }
    });

    // Normalize course data
    const courses = courseRelations.map(relation => {
      const course = relation.toEntity;
      const values = Object.fromEntries(
        course.values.map(v => [
          v.attribute.name,
          v.valueString ?? v.valueNumber ?? v.valueBool ?? v.valueDate ?? v.valueDateTime ?? v.valueText
        ])
      );

      return {
        id: course.id,
        relationId: relation.id,
        ...values,
        metadata: relation.metadata ? JSON.parse(relation.metadata) : {},
        startDate: relation.startDate,
        endDate: relation.endDate
      };
    });

    res.json(courses);
  } catch (error) {
    console.error("Get staff courses error:", error);
    res.status(500).json({ error: "Failed to fetch staff courses" });
  }
});

/**
 * POST /api/staff-courses/:staffId/assign
 * Assign a course to a staff member
 */
staffCoursesRouter.post("/:staffId/assign", authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { staffId } = req.params;
    const { courseId, semester, year, schedule } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: "Course ID is required" });
    }

    // Verify staff exists
    const staffEntity = await prisma.entity.findFirst({
      where: { id: staffId, type: "STAFF" }
    });

    if (!staffEntity) {
      return res.status(404).json({ error: "Staff member not found" });
    }

    // Verify course exists
    const courseEntity = await prisma.entity.findFirst({
      where: { id: courseId, type: "COURSE" }
    });

    if (!courseEntity) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Check if already assigned
    const existingRelation = await prisma.entityRelation.findFirst({
      where: {
        fromEntityId: staffId,
        toEntityId: courseId,
        relationType: "TEACHES",
        isActive: true
      }
    });

    if (existingRelation) {
      return res.status(400).json({ error: "Course is already assigned to this staff member" });
    }

    // Create the relation
    const relation = await prisma.entityRelation.create({
      data: {
        fromEntityId: staffId,
        toEntityId: courseId,
        relationType: "TEACHES",
        metadata: JSON.stringify({ semester, year, schedule }),
        startDate: new Date()
      }
    });

    res.status(201).json({
      message: "Course assigned successfully",
      relationId: relation.id
    });
  } catch (error) {
    console.error("Assign course error:", error);
    res.status(500).json({ error: "Failed to assign course" });
  }
});

/**
 * DELETE /api/staff-courses/:staffId/unassign/:courseId
 * Unassign a course from a staff member
 */
staffCoursesRouter.delete("/:staffId/unassign/:courseId", authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { staffId, courseId } = req.params;

    // Find and deactivate the relation
    const relation = await prisma.entityRelation.updateMany({
      where: {
        fromEntityId: staffId,
        toEntityId: courseId,
        relationType: "TEACHES",
        isActive: true
      },
      data: {
        isActive: false,
        endDate: new Date()
      }
    });

    if (relation.count === 0) {
      return res.status(404).json({ error: "Course assignment not found" });
    }

    res.json({ message: "Course unassigned successfully" });
  } catch (error) {
    console.error("Unassign course error:", error);
    res.status(500).json({ error: "Failed to unassign course" });
  }
});

/**
 * GET /api/staff-courses/:staffId/students
 * Get all students for courses taught by a staff member
 */
staffCoursesRouter.get("/:staffId/students", authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { staffId } = req.params;

    // Get all courses taught by this staff member
    const courseRelations = await prisma.entityRelation.findMany({
      where: {
        fromEntityId: staffId,
        relationType: "TEACHES",
        isActive: true
      }
    });

    const courseIds = courseRelations.map(r => r.toEntityId);

    if (courseIds.length === 0) {
      return res.json([]);
    }

    // Get all students enrolled in these courses
    const studentRelations = await prisma.entityRelation.findMany({
      where: {
        toEntityId: { in: courseIds },
        relationType: "ENROLLED_IN",
        isActive: true
      },
      include: {
        fromEntity: {
          include: {
            values: {
              include: { attribute: true }
            }
          }
        },
        toEntity: {
          include: {
            values: {
              include: { attribute: true }
            }
          }
        }
      }
    });

    // Normalize student data
    const students = studentRelations.map(relation => {
      const student = relation.fromEntity;
      const course = relation.toEntity;

      const studentValues = Object.fromEntries(
        student.values.map(v => [
          v.attribute.name,
          v.valueString ?? v.valueNumber ?? v.valueBool ?? v.valueDate ?? v.valueDateTime ?? v.valueText
        ])
      );

      const courseValues = Object.fromEntries(
        course.values.map(v => [
          v.attribute.name,
          v.valueString ?? v.valueNumber ?? v.valueBool ?? v.valueDate ?? v.valueDateTime ?? v.valueText
        ])
      );

      return {
        id: student.id,
        ...studentValues,
        course: {
          id: course.id,
          name: courseValues.name,
          code: courseValues.code
        },
        enrollmentId: relation.id,
        enrollmentMetadata: relation.metadata ? JSON.parse(relation.metadata) : {}
      };
    });

    res.json(students);
  } catch (error) {
    console.error("Get staff students error:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

/**
 * GET /api/staff-courses/:staffId/schedule
 * Get weekly schedule for a staff member
 */
staffCoursesRouter.get("/:staffId/schedule", authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { staffId } = req.params;

    // Get all courses taught by this staff member with schedule info
    const courseRelations = await prisma.entityRelation.findMany({
      where: {
        fromEntityId: staffId,
        relationType: "TEACHES",
        isActive: true
      },
      include: {
        toEntity: {
          include: {
            values: {
              include: { attribute: true }
            }
          }
        }
      }
    });

    // Build schedule from course data
    const schedule = courseRelations.map(relation => {
      const course = relation.toEntity;
      const values = Object.fromEntries(
        course.values.map(v => [
          v.attribute.name,
          v.valueString ?? v.valueNumber ?? v.valueBool ?? v.valueDate ?? v.valueDateTime ?? v.valueText
        ])
      );

      const metadata = relation.metadata ? JSON.parse(relation.metadata) : {};

      return {
        courseId: course.id,
        courseCode: values.code,
        courseName: values.name,
        schedule: metadata.schedule || values.schedule,
        room: values.room,
        building: values.building
      };
    });

    res.json(schedule);
  } catch (error) {
    console.error("Get staff schedule error:", error);
    res.status(500).json({ error: "Failed to fetch schedule" });
  }
});

/**
 * GET /api/staff-courses/:staffId/performance
 * Get performance metrics for a staff member
 */
staffCoursesRouter.get("/:staffId/performance", authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { staffId } = req.params;

    // Get courses taught
    const courseRelations = await prisma.entityRelation.findMany({
      where: {
        fromEntityId: staffId,
        relationType: "TEACHES",
        isActive: true
      }
    });

    const courseIds = courseRelations.map(r => r.toEntityId);

    // Get student count
    const studentCount = await prisma.entityRelation.count({
      where: {
        toEntityId: { in: courseIds },
        relationType: "ENROLLED_IN",
        isActive: true
      }
    });

    // Mock performance metrics - in production, these would come from actual data
    const metrics = {
      coursesTeaching: courseIds.length,
      totalStudents: studentCount,
      averageRating: 4.8,
      passRate: 87,
      attendance: 95,
      assignmentsGraded: 42,
      officeHoursHeld: 12,
      feedbackScore: 4.5
    };

    res.json(metrics);
  } catch (error) {
    console.error("Get staff performance error:", error);
    res.status(500).json({ error: "Failed to fetch performance metrics" });
  }
});
