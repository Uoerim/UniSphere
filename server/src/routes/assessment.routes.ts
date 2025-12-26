import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "shhhhhhhh";

// Auth middleware
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }
    const token = authHeader.substring(7);
    const decoded: any = jwt.verify(token, JWT_SECRET);
    const account = await prisma.account.findUnique({ where: { id: decoded.userId } });
    if (!account) return res.status(401).json({ error: "User not found" });
    (req as any).user = account;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Admin/Staff only middleware
const requireAdminOrStaff = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || (user.role !== "ADMIN" && user.role !== "STAFF")) {
    return res.status(403).json({ error: "Access denied. Admin or Staff role required." });
  }
  next();
};

// Assessment Types: Final, Midterm, Quiz
const ASSESSMENT_TYPES = ['Final', 'Midterm', 'Quiz'] as const;

// GET all assessments
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    
    // For students, only show assessments for their enrolled courses
    let courseFilter: any = {};
    if (user.role === 'STUDENT') {
      const account = await prisma.account.findUnique({
        where: { id: user.id },
        include: { entity: true }
      });
      
      if (account?.entity) {
        const enrollments = await prisma.entityRelation.findMany({
          where: {
            fromEntityId: account.entity.id,
            relationType: 'ENROLLED_IN',
            isActive: true
          },
          select: { toEntityId: true }
        });
        courseFilter = { courseId: { in: enrollments.map(e => e.toEntityId) } };
      }
    }

    const assessments = await prisma.entity.findMany({
      where: { 
        type: 'ASSESSMENT',
        ...courseFilter
      },
      include: {
        values: { include: { attribute: true } },
        relationsFrom: {
          where: { relationType: 'ASSESSMENT_FOR', isActive: true },
          include: {
            toEntity: {
              include: { values: { include: { attribute: true } } }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = assessments.map(assessment => {
      const attrs: Record<string, any> = {};
      assessment.values.forEach(v => {
        attrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
      });

      // Get related course
      const courseRel = assessment.relationsFrom.find(r => r.relationType === 'ASSESSMENT_FOR');
      let course = null;
      if (courseRel) {
        const courseAttrs: Record<string, any> = {};
        courseRel.toEntity.values.forEach(v => {
          courseAttrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
        });
        course = {
          id: courseRel.toEntity.id,
          name: courseRel.toEntity.name,
          code: courseAttrs.courseCode || courseAttrs.code
        };
      }

      return {
        id: assessment.id,
        name: assessment.name,
        description: assessment.description,
        isActive: assessment.isActive,
        createdAt: assessment.createdAt,
        assessmentType: attrs.assessmentType, // Final, Midterm, Quiz
        totalMarks: attrs.totalMarks || attrs.maxScore,
        passingMarks: attrs.passingMarks,
        duration: attrs.duration, // in minutes
        date: attrs.date || attrs.examDate,
        startTime: attrs.startTime,
        endTime: attrs.endTime,
        room: attrs.room || attrs.location,
        instructions: attrs.instructions,
        course,
        weight: attrs.weight // percentage of final grade
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error("Get assessments error:", error);
    res.status(500).json({ error: "Failed to fetch assessments" });
  }
});

// GET assessments for a specific course
router.get("/course/:courseId", authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const relations = await prisma.entityRelation.findMany({
      where: {
        toEntityId: courseId,
        relationType: 'ASSESSMENT_FOR',
        isActive: true
      },
      include: {
        fromEntity: {
          include: {
            values: { include: { attribute: true } }
          }
        }
      }
    });

    const assessments = relations.map(rel => {
      const assessment = rel.fromEntity;
      const attrs: Record<string, any> = {};
      assessment.values.forEach(v => {
        attrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
      });

      return {
        id: assessment.id,
        name: assessment.name,
        description: assessment.description,
        isActive: assessment.isActive,
        assessmentType: attrs.assessmentType,
        totalMarks: attrs.totalMarks || attrs.maxScore,
        passingMarks: attrs.passingMarks,
        duration: attrs.duration,
        date: attrs.date || attrs.examDate,
        startTime: attrs.startTime,
        endTime: attrs.endTime,
        room: attrs.room || attrs.location,
        weight: attrs.weight
      };
    });

    res.json(assessments);
  } catch (error) {
    console.error("Get course assessments error:", error);
    res.status(500).json({ error: "Failed to fetch course assessments" });
  }
});

// GET assessment stats
router.get("/stats/overview", authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const assessments = await prisma.entity.findMany({
      where: { type: 'ASSESSMENT' },
      include: {
        values: { include: { attribute: true } }
      }
    });

    const stats = {
      total: assessments.length,
      active: assessments.filter(a => a.isActive).length,
      byType: {
        Final: 0,
        Midterm: 0,
        Quiz: 0
      },
      upcoming: 0
    };

    const today = new Date();
    assessments.forEach(a => {
      const typeValue = a.values.find(v => v.attribute.name === 'assessmentType');
      const dateValue = a.values.find(v => v.attribute.name === 'date' || v.attribute.name === 'examDate');
      
      if (typeValue?.valueString && typeValue.valueString in stats.byType) {
        stats.byType[typeValue.valueString as keyof typeof stats.byType]++;
      }
      
      if (dateValue?.valueDate && new Date(dateValue.valueDate) > today) {
        stats.upcoming++;
      }
    });

    res.json(stats);
  } catch (error) {
    console.error("Get assessment stats error:", error);
    res.status(500).json({ error: "Failed to fetch assessment stats" });
  }
});

// GET single assessment
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const assessment = await prisma.entity.findUnique({
      where: { id },
      include: {
        values: { include: { attribute: true } },
        relationsFrom: {
          where: { isActive: true },
          include: {
            toEntity: {
              include: { values: { include: { attribute: true } } }
            }
          }
        }
      }
    });

    if (!assessment) {
      return res.status(404).json({ error: "Assessment not found" });
    }

    const attrs: Record<string, any> = {};
    assessment.values.forEach(v => {
      attrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
    });

    // Get related course
    const courseRel = assessment.relationsFrom.find(r => r.relationType === 'ASSESSMENT_FOR');
    let course = null;
    if (courseRel) {
      const courseAttrs: Record<string, any> = {};
      courseRel.toEntity.values.forEach(v => {
        courseAttrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
      });
      course = {
        id: courseRel.toEntity.id,
        name: courseRel.toEntity.name,
        code: courseAttrs.courseCode || courseAttrs.code
      };
    }

    res.json({
      id: assessment.id,
      name: assessment.name,
      description: assessment.description,
      isActive: assessment.isActive,
      createdAt: assessment.createdAt,
      ...attrs,
      course
    });
  } catch (error) {
    console.error("Get assessment error:", error);
    res.status(500).json({ error: "Failed to fetch assessment" });
  }
});

// CREATE assessment
router.post("/", authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const {
      name, description, courseId, assessmentType, totalMarks, passingMarks,
      duration, date, startTime, endTime, room, instructions, weight
    } = req.body;

    if (!name || !courseId) {
      return res.status(400).json({ error: "Name and course are required" });
    }

    if (assessmentType && !ASSESSMENT_TYPES.includes(assessmentType)) {
      return res.status(400).json({ error: "Invalid assessment type. Must be Final, Midterm, or Quiz" });
    }

    // Create assessment entity
    const assessment = await prisma.entity.create({
      data: {
        type: 'ASSESSMENT',
        name,
        description
      }
    });

    // Get or create attributes
    const attributeConfigs = [
      { name: 'assessmentType', value: assessmentType, dataType: 'STRING' as const },
      { name: 'totalMarks', value: totalMarks, dataType: 'NUMBER' as const },
      { name: 'passingMarks', value: passingMarks, dataType: 'NUMBER' as const },
      { name: 'duration', value: duration, dataType: 'NUMBER' as const },
      { name: 'date', value: date, dataType: 'DATE' as const },
      { name: 'startTime', value: startTime, dataType: 'STRING' as const },
      { name: 'endTime', value: endTime, dataType: 'STRING' as const },
      { name: 'room', value: room, dataType: 'STRING' as const },
      { name: 'instructions', value: instructions, dataType: 'TEXT' as const },
      { name: 'weight', value: weight, dataType: 'NUMBER' as const }
    ];

    for (const config of attributeConfigs) {
      if (config.value !== undefined && config.value !== null && config.value !== '') {
        let attr = await prisma.attribute.findFirst({ where: { name: config.name } });
        if (!attr) {
          attr = await prisma.attribute.create({
            data: {
              name: config.name,
              displayName: config.name.charAt(0).toUpperCase() + config.name.slice(1).replace(/([A-Z])/g, ' $1'),
              entityTypes: JSON.stringify(['ASSESSMENT']),
              dataType: config.dataType,
              category: 'ACADEMIC'
            }
          });
        }

        const valueData: any = {
          entityId: assessment.id,
          attributeId: attr.id
        };

        if (config.dataType === 'NUMBER') {
          valueData.valueNumber = parseFloat(config.value);
        } else if (config.dataType === 'DATE') {
          valueData.valueDate = new Date(config.value);
        } else {
          valueData.valueString = String(config.value);
        }

        await prisma.value.create({ data: valueData });
      }
    }

    // Create relation to course
    await prisma.entityRelation.create({
      data: {
        fromEntityId: assessment.id,
        toEntityId: courseId,
        relationType: 'ASSESSMENT_FOR',
        isActive: true
      }
    });

    res.status(201).json({
      id: assessment.id,
      name: assessment.name,
      message: "Assessment created successfully"
    });
  } catch (error) {
    console.error("Create assessment error:", error);
    res.status(500).json({ error: "Failed to create assessment" });
  }
});

// UPDATE assessment
router.put("/:id", authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, description, isActive, assessmentType, totalMarks, passingMarks,
      duration, date, startTime, endTime, room, instructions, weight, courseId
    } = req.body;

    // Update entity
    const assessment = await prisma.entity.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });

    // Update attribute values
    const attributeUpdates = [
      { name: 'assessmentType', value: assessmentType, dataType: 'STRING' as const },
      { name: 'totalMarks', value: totalMarks, dataType: 'NUMBER' as const },
      { name: 'passingMarks', value: passingMarks, dataType: 'NUMBER' as const },
      { name: 'duration', value: duration, dataType: 'NUMBER' as const },
      { name: 'date', value: date, dataType: 'DATE' as const },
      { name: 'startTime', value: startTime, dataType: 'STRING' as const },
      { name: 'endTime', value: endTime, dataType: 'STRING' as const },
      { name: 'room', value: room, dataType: 'STRING' as const },
      { name: 'instructions', value: instructions, dataType: 'TEXT' as const },
      { name: 'weight', value: weight, dataType: 'NUMBER' as const }
    ];

    for (const update of attributeUpdates) {
      if (update.value !== undefined) {
        const attr = await prisma.attribute.findFirst({ where: { name: update.name } });
        if (attr) {
          const valueData: any = {};
          if (update.dataType === 'NUMBER') {
            valueData.valueNumber = parseFloat(update.value);
          } else if (update.dataType === 'DATE') {
            valueData.valueDate = new Date(update.value);
          } else {
            valueData.valueString = String(update.value);
          }

          await prisma.value.upsert({
            where: {
              entityId_attributeId: { entityId: id, attributeId: attr.id }
            },
            update: valueData,
            create: {
              entityId: id,
              attributeId: attr.id,
              ...valueData
            }
          });
        }
      }
    }

    // Update course relation if courseId provided
    if (courseId) {
      // Deactivate old relations
      await prisma.entityRelation.updateMany({
        where: { fromEntityId: id, relationType: 'ASSESSMENT_FOR' },
        data: { isActive: false }
      });

      // Create new relation
      await prisma.entityRelation.create({
        data: {
          fromEntityId: id,
          toEntityId: courseId,
          relationType: 'ASSESSMENT_FOR',
          isActive: true
        }
      });
    }

    res.json({ id: assessment.id, message: "Assessment updated successfully" });
  } catch (error) {
    console.error("Update assessment error:", error);
    res.status(500).json({ error: "Failed to update assessment" });
  }
});

// DELETE assessment
router.delete("/:id", authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { id } = req.params;

    // Delete values
    await prisma.value.deleteMany({ where: { entityId: id } });
    // Delete relations
    await prisma.entityRelation.deleteMany({
      where: { OR: [{ fromEntityId: id }, { toEntityId: id }] }
    });
    // Delete entity
    await prisma.entity.delete({ where: { id } });

    res.json({ message: "Assessment deleted successfully" });
  } catch (error) {
    console.error("Delete assessment error:", error);
    res.status(500).json({ error: "Failed to delete assessment" });
  }
});

// GET student grades for an assessment
router.get("/:id/grades", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const relations = await prisma.entityRelation.findMany({
      where: {
        toEntityId: id,
        relationType: 'GRADED_IN',
        isActive: true
      },
      include: {
        fromEntity: {
          include: {
            values: { include: { attribute: true } },
            account: { select: { email: true } }
          }
        }
      }
    });

    const grades = relations.map(rel => {
      const student = rel.fromEntity;
      const attrs: Record<string, any> = {};
      student.values.forEach(v => {
        attrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
      });

      // Parse metadata for grade info
      let gradeInfo = {};
      if (rel.metadata) {
        try {
          gradeInfo = JSON.parse(rel.metadata);
        } catch (e) {
          // ignore parse error
        }
      }

      return {
        studentId: student.id,
        studentName: attrs.firstName && attrs.lastName 
          ? `${attrs.firstName} ${attrs.lastName}` 
          : student.account?.email || 'Unknown',
        email: student.account?.email,
        ...gradeInfo
      };
    });

    res.json(grades);
  } catch (error) {
    console.error("Get assessment grades error:", error);
    res.status(500).json({ error: "Failed to fetch grades" });
  }
});

// Record student grade for an assessment
router.post("/:id/grades", authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const assessmentId = req.params.id;
    const { studentId, score, feedback, status } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: "Student ID is required" });
    }

    // Get student entity
    const studentAccount = await prisma.account.findUnique({
      where: { id: studentId },
      include: { entity: true }
    });

    if (!studentAccount?.entity) {
      return res.status(404).json({ error: "Student entity not found" });
    }

    const metadata = JSON.stringify({ score, feedback, status: status || 'graded', gradedAt: new Date() });

    // Check if grade already exists
    const existing = await prisma.entityRelation.findFirst({
      where: {
        fromEntityId: studentAccount.entity.id,
        toEntityId: assessmentId,
        relationType: 'GRADED_IN'
      }
    });

    if (existing) {
      await prisma.entityRelation.update({
        where: { id: existing.id },
        data: { metadata, isActive: true }
      });
    } else {
      await prisma.entityRelation.create({
        data: {
          fromEntityId: studentAccount.entity.id,
          toEntityId: assessmentId,
          relationType: 'GRADED_IN',
          metadata,
          isActive: true
        }
      });
    }

    res.json({ message: "Grade recorded successfully" });
  } catch (error) {
    console.error("Record grade error:", error);
    res.status(500).json({ error: "Failed to record grade" });
  }
});

export const assessmentRouter = router;
