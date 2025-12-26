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

// Assignment Status Types
const ASSIGNMENT_STATUS = ['Draft', 'Published', 'Closed', 'Archived'] as const;

// GET all assignments
router.get("/", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    
    // For students, only show assignments for their enrolled courses
    let enrolledCourseIds: string[] = [];
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
        enrolledCourseIds = enrollments.map(e => e.toEntityId);
      }
    }

    const assignmentEntities = await prisma.entity.findMany({
      where: { type: 'ASSIGNMENT' }, // Using ASSIGNMENT type for assignments
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
      },
      orderBy: { createdAt: 'desc' }
    });

    const assignments = assignmentEntities
      .map(assignment => {
        const attrs: Record<string, any> = {};
        assignment.values.forEach(v => {
          attrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
        });

        // Get related course
        const courseRel = assignment.relationsFrom.find(r => r.relationType === 'ASSIGNMENT_FOR');
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

        // Filter for students
        if (user.role === 'STUDENT' && course && !enrolledCourseIds.includes(course.id)) {
          return null;
        }

        return {
          id: assignment.id,
          name: assignment.name,
          description: assignment.description,
          isActive: assignment.isActive,
          createdAt: assignment.createdAt,
          title: attrs.title || assignment.name,
          instructions: attrs.instructions,
          dueDate: attrs.dueDate,
          dueTime: attrs.dueTime,
          totalPoints: attrs.totalPoints || attrs.maxScore,
          status: attrs.status || 'Published',
          allowLateSubmission: attrs.allowLateSubmission,
          latePenaltyPercent: attrs.latePenaltyPercent,
          attachments: attrs.attachments ? JSON.parse(attrs.attachments) : [],
          submissionType: attrs.submissionType || 'File', // File, Text, Link
          course
        };
      })
      .filter(a => a !== null);

    res.json(assignments);
  } catch (error) {
    console.error("Get assignments error:", error);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
});

// GET assignments for a specific course
router.get("/course/:courseId", authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const relations = await prisma.entityRelation.findMany({
      where: {
        toEntityId: courseId,
        relationType: 'ASSIGNMENT_FOR',
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

    const assignments = relations.map(rel => {
      const assignment = rel.fromEntity;
      const attrs: Record<string, any> = {};
      assignment.values.forEach(v => {
        attrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
      });

      return {
        id: assignment.id,
        name: assignment.name,
        description: assignment.description,
        isActive: assignment.isActive,
        title: attrs.title || assignment.name,
        dueDate: attrs.dueDate,
        dueTime: attrs.dueTime,
        totalPoints: attrs.totalPoints || attrs.maxScore,
        status: attrs.status || 'Published',
        submissionType: attrs.submissionType || 'File'
      };
    });

    res.json(assignments);
  } catch (error) {
    console.error("Get course assignments error:", error);
    res.status(500).json({ error: "Failed to fetch course assignments" });
  }
});

// GET assignment stats
router.get("/stats/overview", authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const assignments = await prisma.entity.findMany({
      where: { type: 'ASSIGNMENT' },
      include: {
        values: { include: { attribute: true } }
      }
    });

    const stats = {
      total: assignments.length,
      active: assignments.filter(a => a.isActive).length,
      byStatus: {
        Draft: 0,
        Published: 0,
        Closed: 0,
        Archived: 0
      },
      dueSoon: 0 // Due within 7 days
    };

    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    assignments.forEach(a => {
      const statusValue = a.values.find(v => v.attribute.name === 'status');
      const dueDateValue = a.values.find(v => v.attribute.name === 'dueDate');
      
      const status = statusValue?.valueString || 'Published';
      if (status in stats.byStatus) {
        stats.byStatus[status as keyof typeof stats.byStatus]++;
      }
      
      if (dueDateValue?.valueDate) {
        const dueDate = new Date(dueDateValue.valueDate);
        if (dueDate > today && dueDate <= weekFromNow) {
          stats.dueSoon++;
        }
      }
    });

    res.json(stats);
  } catch (error) {
    console.error("Get assignment stats error:", error);
    res.status(500).json({ error: "Failed to fetch assignment stats" });
  }
});

// GET single assignment
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const assignment = await prisma.entity.findUnique({
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
        },
        relationsTo: {
          where: { relationType: 'SUBMITTED_FOR', isActive: true },
          include: {
            fromEntity: {
              include: {
                values: { include: { attribute: true } },
                account: { select: { email: true } }
              }
            }
          }
        }
      }
    });

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    const attrs: Record<string, any> = {};
    assignment.values.forEach(v => {
      attrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
    });

    // Get related course
    const courseRel = assignment.relationsFrom.find(r => r.relationType === 'ASSIGNMENT_FOR');
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

    // Get submissions count
    const submissionCount = assignment.relationsTo.length;

    res.json({
      id: assignment.id,
      name: assignment.name,
      description: assignment.description,
      isActive: assignment.isActive,
      createdAt: assignment.createdAt,
      ...attrs,
      attachments: attrs.attachments ? JSON.parse(attrs.attachments) : [],
      course,
      submissionCount
    });
  } catch (error) {
    console.error("Get assignment error:", error);
    res.status(500).json({ error: "Failed to fetch assignment" });
  }
});

// CREATE assignment
router.post("/", authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const {
      title, description, courseId, instructions, dueDate, dueTime, totalPoints,
      status, allowLateSubmission, latePenaltyPercent, submissionType, attachments
    } = req.body;

    if (!title || !courseId) {
      return res.status(400).json({ error: "Title and course are required" });
    }

    // Create assignment entity
    const assignment = await prisma.entity.create({
      data: {
        type: 'ASSIGNMENT', // Using ASSIGNMENT type
        name: title,
        description
      }
    });

    // Get or create attributes
    const attributeConfigs = [
      { name: 'title', value: title, dataType: 'STRING' as const },
      { name: 'instructions', value: instructions, dataType: 'TEXT' as const },
      { name: 'dueDate', value: dueDate, dataType: 'DATE' as const },
      { name: 'dueTime', value: dueTime, dataType: 'STRING' as const },
      { name: 'totalPoints', value: totalPoints, dataType: 'NUMBER' as const },
      { name: 'status', value: status || 'Published', dataType: 'STRING' as const },
      { name: 'allowLateSubmission', value: allowLateSubmission, dataType: 'BOOLEAN' as const },
      { name: 'latePenaltyPercent', value: latePenaltyPercent, dataType: 'NUMBER' as const },
      { name: 'submissionType', value: submissionType || 'File', dataType: 'STRING' as const },
      { name: 'attachments', value: attachments ? JSON.stringify(attachments) : null, dataType: 'TEXT' as const }
    ];

    for (const config of attributeConfigs) {
      if (config.value !== undefined && config.value !== null && config.value !== '') {
        let attr = await prisma.attribute.findFirst({ where: { name: config.name } });
        if (!attr) {
          attr = await prisma.attribute.create({
            data: {
              name: config.name,
              displayName: config.name.charAt(0).toUpperCase() + config.name.slice(1).replace(/([A-Z])/g, ' $1'),
              entityTypes: JSON.stringify(['ASSIGNMENT']),
              dataType: config.dataType,
              category: 'ACADEMIC'
            }
          });
        }

        const valueData: any = {
          entityId: assignment.id,
          attributeId: attr.id
        };

        if (config.dataType === 'NUMBER') {
          valueData.valueNumber = parseFloat(config.value as string);
        } else if (config.dataType === 'DATE') {
          valueData.valueDate = new Date(config.value as string);
        } else if (config.dataType === 'BOOLEAN') {
          valueData.valueBool = Boolean(config.value);
        } else {
          valueData.valueString = String(config.value);
        }

        await prisma.value.create({ data: valueData });
      }
    }

    // Create relation to course
    await prisma.entityRelation.create({
      data: {
        fromEntityId: assignment.id,
        toEntityId: courseId,
        relationType: 'ASSIGNMENT_FOR',
        isActive: true
      }
    });

    res.status(201).json({
      id: assignment.id,
      name: assignment.name,
      message: "Assignment created successfully"
    });
  } catch (error) {
    console.error("Create assignment error:", error);
    res.status(500).json({ error: "Failed to create assignment" });
  }
});

// UPDATE assignment
router.put("/:id", authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title, description, isActive, instructions, dueDate, dueTime, totalPoints,
      status, allowLateSubmission, latePenaltyPercent, submissionType, attachments, courseId
    } = req.body;

    // Update entity
    const assignment = await prisma.entity.update({
      where: { id },
      data: {
        name: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });

    // Update attribute values
    const attributeUpdates = [
      { name: 'title', value: title, dataType: 'STRING' as const },
      { name: 'instructions', value: instructions, dataType: 'TEXT' as const },
      { name: 'dueDate', value: dueDate, dataType: 'DATE' as const },
      { name: 'dueTime', value: dueTime, dataType: 'STRING' as const },
      { name: 'totalPoints', value: totalPoints, dataType: 'NUMBER' as const },
      { name: 'status', value: status, dataType: 'STRING' as const },
      { name: 'allowLateSubmission', value: allowLateSubmission, dataType: 'BOOLEAN' as const },
      { name: 'latePenaltyPercent', value: latePenaltyPercent, dataType: 'NUMBER' as const },
      { name: 'submissionType', value: submissionType, dataType: 'STRING' as const },
      { name: 'attachments', value: attachments ? JSON.stringify(attachments) : undefined, dataType: 'TEXT' as const }
    ];

    for (const update of attributeUpdates) {
      if (update.value !== undefined) {
        const attr = await prisma.attribute.findFirst({ where: { name: update.name } });
        if (attr) {
          const valueData: any = {};
          if (update.dataType === 'NUMBER') {
            valueData.valueNumber = parseFloat(update.value as string);
          } else if (update.dataType === 'DATE') {
            valueData.valueDate = new Date(update.value as string);
          } else if (update.dataType === 'BOOLEAN') {
            valueData.valueBool = Boolean(update.value);
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
      await prisma.entityRelation.updateMany({
        where: { fromEntityId: id, relationType: 'ASSIGNMENT_FOR' },
        data: { isActive: false }
      });

      await prisma.entityRelation.create({
        data: {
          fromEntityId: id,
          toEntityId: courseId,
          relationType: 'ASSIGNMENT_FOR',
          isActive: true
        }
      });
    }

    res.json({ id: assignment.id, message: "Assignment updated successfully" });
  } catch (error) {
    console.error("Update assignment error:", error);
    res.status(500).json({ error: "Failed to update assignment" });
  }
});

// DELETE assignment
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

    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    console.error("Delete assignment error:", error);
    res.status(500).json({ error: "Failed to delete assignment" });
  }
});

// GET submissions for an assignment
router.get("/:id/submissions", authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { id } = req.params;

    const relations = await prisma.entityRelation.findMany({
      where: {
        toEntityId: id,
        relationType: 'SUBMITTED_FOR',
        isActive: true
      },
      include: {
        fromEntity: {
          include: {
            values: { include: { attribute: true } },
            account: { select: { email: true, id: true } }
          }
        }
      }
    });

    const submissions = relations.map(rel => {
      const student = rel.fromEntity;
      const attrs: Record<string, any> = {};
      student.values.forEach(v => {
        attrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
      });

      // Parse metadata for submission info
      let submissionInfo: any = {};
      if (rel.metadata) {
        try {
          submissionInfo = JSON.parse(rel.metadata);
        } catch (e) {
          // ignore parse error
        }
      }

      return {
        id: rel.id,
        studentId: student.account?.id,
        entityId: student.id,
        studentName: attrs.firstName && attrs.lastName 
          ? `${attrs.firstName} ${attrs.lastName}` 
          : student.account?.email || 'Unknown',
        email: student.account?.email,
        submittedAt: submissionInfo.submittedAt || rel.createdAt,
        content: submissionInfo.content,
        fileUrl: submissionInfo.fileUrl,
        score: submissionInfo.score,
        feedback: submissionInfo.feedback,
        status: submissionInfo.status || 'submitted',
        isLate: submissionInfo.isLate || false
      };
    });

    res.json(submissions);
  } catch (error) {
    console.error("Get submissions error:", error);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

// Submit assignment (for students)
router.post("/:id/submit", authenticateToken, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const user = (req as any).user;
    const { content, fileUrl } = req.body;

    // Get student entity
    const account = await prisma.account.findUnique({
      where: { id: user.id },
      include: { entity: true }
    });

    if (!account?.entity) {
      return res.status(404).json({ error: "Student entity not found" });
    }

    // Get assignment to check due date
    const assignment = await prisma.entity.findUnique({
      where: { id: assignmentId },
      include: { values: { include: { attribute: true } } }
    });

    if (!assignment) {
      return res.status(404).json({ error: "Assignment not found" });
    }

    const dueDateValue = assignment.values.find(v => v.attribute.name === 'dueDate');
    const isLate = dueDateValue?.valueDate && new Date() > new Date(dueDateValue.valueDate);

    const metadata = JSON.stringify({
      content,
      fileUrl,
      submittedAt: new Date(),
      isLate,
      status: 'submitted'
    });

    // Check if already submitted
    const existing = await prisma.entityRelation.findFirst({
      where: {
        fromEntityId: account.entity.id,
        toEntityId: assignmentId,
        relationType: 'SUBMITTED_FOR'
      }
    });

    if (existing) {
      await prisma.entityRelation.update({
        where: { id: existing.id },
        data: { metadata, updatedAt: new Date() }
      });
      return res.json({ message: "Submission updated successfully", isLate });
    }

    await prisma.entityRelation.create({
      data: {
        fromEntityId: account.entity.id,
        toEntityId: assignmentId,
        relationType: 'SUBMITTED_FOR',
        metadata,
        isActive: true
      }
    });

    res.json({ message: "Assignment submitted successfully", isLate });
  } catch (error) {
    console.error("Submit assignment error:", error);
    res.status(500).json({ error: "Failed to submit assignment" });
  }
});

// Grade a submission
router.post("/:id/submissions/:submissionId/grade", authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { score, feedback } = req.body;

    const relation = await prisma.entityRelation.findUnique({
      where: { id: submissionId }
    });

    if (!relation) {
      return res.status(404).json({ error: "Submission not found" });
    }

    let currentMetadata: any = {};
    if (relation.metadata) {
      try {
        currentMetadata = JSON.parse(relation.metadata);
      } catch (e) {
        // ignore
      }
    }

    const newMetadata = {
      ...currentMetadata,
      score,
      feedback,
      status: 'graded',
      gradedAt: new Date()
    };

    await prisma.entityRelation.update({
      where: { id: submissionId },
      data: { metadata: JSON.stringify(newMetadata) }
    });

    res.json({ message: "Submission graded successfully" });
  } catch (error) {
    console.error("Grade submission error:", error);
    res.status(500).json({ error: "Failed to grade submission" });
  }
});

export const assignmentRouter = router;
