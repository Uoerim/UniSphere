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

// GET courses for current user (enrolled courses for students, taught courses for staff)
router.get("/my-courses", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    // Find the user's entity via account relation
    const account = await prisma.account.findUnique({
      where: { id: user.id },
      include: { entity: true }
    });

    if (!account?.entity) {
      return res.json([]);
    }

    const userEntityId = account.entity.id;

    // Get courses based on user role
    const relationType = user.role === 'STAFF' ? 'TEACHES' : 'ENROLLED_IN';

    const relations = await prisma.entityRelation.findMany({
      where: {
        fromEntityId: userEntityId,
        relationType,
        isActive: true
      },
      include: {
        toEntity: {
          include: {
            values: { include: { attribute: true } },
            relationsTo: {
              where: { relationType: 'TEACHES', isActive: true },
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
        }
      }
    });

    const courses = relations.map((rel: any) => {
      const course = rel.toEntity;
      const attrs: Record<string, any> = {};
      course.values.forEach((v: any) => {
        attrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
      });

      // Get all instructors
      const instructorRels = course.relationsTo.filter((r: any) => r.relationType === 'TEACHES' && r.isActive);
      const instructors = instructorRels.map((ir: any) => {
        const instrEntity = ir.fromEntity;
        const instrAttrs: Record<string, any> = {};
        instrEntity.values.forEach((v: any) => {
          instrAttrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
        });
        return {
          id: instrEntity.id,
          name: instrAttrs.firstName && instrAttrs.lastName
            ? `${instrAttrs.firstName} ${instrAttrs.lastName}`
            : instrEntity.account?.email || 'Unknown',
          email: instrEntity.account?.email
        };
      });
      
      // Legacy support
      const instructor = instructors.length > 0 ? instructors[0] : null;

      return {
        id: course.id,
        name: course.name,
        description: course.description,
        isActive: course.isActive,
        code: attrs.courseCode || attrs.code,
        credits: attrs.credits,
        department: attrs.department,
        semester: attrs.semester,
        courseType: attrs.courseType,
        room: attrs.room,
        schedule: attrs.schedule,
        scheduleDisplay: attrs.scheduleDisplay,
        capacity: attrs.capacity || 30,
        instructor,
        instructors
      };
    });

    res.json(courses);
  } catch (error) {
    console.error("Get my courses error:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

// GET students enrolled in a specific course
router.get("/:id/students", authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.id as string;

    const enrollments = await prisma.entityRelation.findMany({
      where: {
        toEntityId: courseId,
        relationType: 'ENROLLED_IN',
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

    const students = enrollments.map((rel: any) => {
      const student = rel.fromEntity;
      const attrs: Record<string, any> = {};
      student.values.forEach((v: any) => {
        attrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
      });

      return {
        id: student.id,
        name: attrs.firstName && attrs.lastName
          ? `${attrs.firstName} ${attrs.lastName}`
          : student.account?.email || 'Unknown',
        email: student.account?.email,
        enrollmentId: rel.id
      };
    });

    res.json(students);
  } catch (error) {
    console.error("Get course students error:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// GET courses for a specific student (for parents to view)
router.get("/student/:studentId/courses", authenticateToken, async (req, res) => {
  try {
    const studentId = req.params.studentId as string;

    const enrollments = await prisma.entityRelation.findMany({
      where: {
        fromEntityId: studentId,
        relationType: 'ENROLLED_IN',
        isActive: true
      },
      include: {
        toEntity: {
          include: {
            values: { include: { attribute: true } },
            relationsTo: {
              where: { relationType: 'TEACHES', isActive: true },
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
        }
      }
    });

    const courses = enrollments.map((rel: any) => {
      const course = rel.toEntity;
      const attrs: Record<string, any> = {};
      course.values.forEach((v: any) => {
        attrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
      });

      // Get all instructors
      const instructorRels = course.relationsTo.filter((r: any) => r.relationType === 'TEACHES' && r.isActive);
      const instructors = instructorRels.map((ir: any) => {
        const instrEntity = ir.fromEntity;
        const instrAttrs: Record<string, any> = {};
        instrEntity.values.forEach((v: any) => {
          instrAttrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
        });
        return {
          id: instrEntity.id,
          name: instrAttrs.firstName && instrAttrs.lastName
            ? `${instrAttrs.firstName} ${instrAttrs.lastName}`
            : instrEntity.account?.email || 'Unknown',
          email: instrEntity.account?.email
        };
      });
      
      // Legacy support
      const instructor = instructors.length > 0 ? instructors[0] : null;

      return {
        id: course.id,
        name: course.name,
        description: course.description,
        isActive: course.isActive,
        code: attrs.courseCode || attrs.code,
        credits: attrs.credits,
        department: attrs.department,
        semester: attrs.semester,
        courseType: attrs.courseType,
        room: attrs.room,
        schedule: attrs.schedule,
        scheduleDisplay: attrs.scheduleDisplay,
        instructor,
        instructors
      };
    });

    res.json(courses);
  } catch (error) {
    console.error("Get student courses error:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

// GET all courses with enrollment and instructor data
router.get("/", authenticateToken, async (req, res) => {
  try {
    const courses = await prisma.entity.findMany({
      where: { type: 'COURSE' },
      include: {
        values: {
          include: { attribute: true }
        },
        relationsTo: {
          where: { relationType: { in: ['TEACHES', 'ENROLLED_IN'] }, isActive: true },
          include: {
            fromEntity: {
              include: {
                values: { include: { attribute: true } },
                account: { select: { email: true, id: true } }
              }
            }
          }
        },
        // Prerequisites: this course requires these other courses
        relationsFrom: {
          where: { relationType: 'PREREQUISITE', isActive: true },
          include: {
            toEntity: {
              include: {
                values: { include: { attribute: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedCourses = courses.map((course: any) => {
      const attrs: Record<string, string | number | boolean | Date | null> = {};
      course.values.forEach((v: any) => {
        attrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate || v.valueDateTime || v.valueText;
      });

      // Find all instructors (TEACHES relations)
      const instructorRelations = course.relationsTo.filter((r: any) => r.relationType === 'TEACHES' && r.isActive);
      const instructors = instructorRelations.map((rel: any) => {
        const instructorEntity = rel.fromEntity;
        const instrAttrs: Record<string, any> = {};
        instructorEntity.values.forEach((v: any) => {
          instrAttrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
        });
        return {
          id: instructorEntity.id,
          name: instrAttrs.firstName && instrAttrs.lastName
            ? `${instrAttrs.firstName} ${instrAttrs.lastName}`
            : instructorEntity.account?.email || 'Unknown',
          email: instructorEntity.account?.email
        };
      });
      
      // Legacy support: also include single instructor field
      const instructor = instructors.length > 0 ? instructors[0] : null;

      // Count enrolled students
      const enrolledStudents = course.relationsTo.filter((r: any) => r.relationType === 'ENROLLED_IN').length;

      // Get prerequisites
      const prerequisites = course.relationsFrom
        .filter((r: any) => r.relationType === 'PREREQUISITE')
        .map((r: any) => {
          const prereqCourse = r.toEntity;
          const prereqAttrs: Record<string, any> = {};
          prereqCourse.values.forEach((v: any) => {
            prereqAttrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
          });
          return {
            id: prereqCourse.id,
            name: prereqCourse.name,
            code: prereqAttrs.courseCode || prereqAttrs.code
          };
        });

      return {
        id: course.id,
        name: course.name,
        description: course.description,
        isActive: course.isActive,
        createdAt: course.createdAt,
        code: attrs.courseCode || attrs.code,
        credits: attrs.credits,
        department: attrs.department,
        semester: attrs.semester,
        courseType: attrs.courseType || attrs.type,
        capacity: attrs.capacity || 30,
        room: attrs.room,
        schedule: attrs.schedule,
        instructor,
        instructors,
        enrolledStudents,
        prerequisites,
        ...attrs
      };
    });

    res.json(formattedCourses);
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

// GET single course with full details
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const id = req.params.id as string;
    if (!id) {
      return res.status(400).json({ error: "Course ID is required" });
    }

    const course = await prisma.entity.findUnique({
      where: { id },
      include: {
        values: { include: { attribute: true } },
        relationsTo: {
          where: { isActive: true },
          include: {
            fromEntity: {
              include: {
                values: { include: { attribute: true } },
                account: { select: { email: true, id: true } }
              }
            }
          }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const attrs: Record<string, string | number | boolean | Date | null> = {};
    course.values.forEach((v: any) => {
      attrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate || v.valueDateTime || v.valueText;
    });

    // Get instructor
    const instructorRelation = (course as any).relationsTo.find((r: any) => r.relationType === 'TEACHES');
    let instructor = null;
    if (instructorRelation) {
      const instructorEntity = instructorRelation.fromEntity;
      const instrAttrs: Record<string, any> = {};
      instructorEntity.values.forEach((v: any) => {
        instrAttrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
      });
      instructor = {
        id: instructorEntity.id,
        name: instrAttrs.firstName && instrAttrs.lastName
          ? `${instrAttrs.firstName} ${instrAttrs.lastName}`
          : instructorEntity.account?.email || 'Unknown',
        email: instructorEntity.account?.email
      };
    }

    // Get enrolled students
    const enrolledStudents = (course as any).relationsTo
      .filter((r: any) => r.relationType === 'ENROLLED_IN')
      .map((r: any) => {
        const student = r.fromEntity;
        const studentAttrs: Record<string, any> = {};
        student.values.forEach((v: any) => {
          studentAttrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
        });
        return {
          id: student.id,
          name: studentAttrs.firstName && studentAttrs.lastName
            ? `${studentAttrs.firstName} ${studentAttrs.lastName}`
            : student.account?.email || 'Unknown',
          email: student.account?.email,
          enrollmentId: r.id,
          metadata: r.metadata ? JSON.parse(r.metadata) : {}
        };
      });

    res.json({
      id: course.id,
      name: course.name,
      description: course.description,
      isActive: course.isActive,
      createdAt: course.createdAt,
      code: attrs.courseCode || attrs.code,
      credits: attrs.credits,
      department: attrs.department,
      semester: attrs.semester,
      courseType: attrs.courseType || attrs.type,
      capacity: attrs.capacity || 30,
      room: attrs.room,
      schedule: attrs.schedule,
      instructor,
      enrolledStudents,
      ...attrs
    });
  } catch (error) {
    console.error("Get course error:", error);
    res.status(500).json({ error: "Failed to fetch course" });
  }
});

// GET available instructors (staff members)
router.get("/instructors/available", authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const staffAccounts = await prisma.account.findMany({
      where: { role: 'STAFF', isActive: true },
      include: {
        entity: {
          include: {
            values: { include: { attribute: true } }
          }
        }
      }
    });

    const instructors = staffAccounts.map((account: any) => {
      if (!account.entity) {
        return {
          id: null,
          accountId: account.id,
          email: account.email,
          name: account.email.split('@')[0]
        };
      }

      const attrs: Record<string, any> = {};
      account.entity.values.forEach((v: any) => {
        attrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
      });

      return {
        id: account.entity.id,
        accountId: account.id,
        email: account.email,
        name: attrs.firstName && attrs.lastName
          ? `${attrs.firstName} ${attrs.lastName}`
          : account.email.split('@')[0]
      };
    });

    res.json(instructors);
  } catch (error) {
    console.error("Get instructors error:", error);
    res.status(500).json({ error: "Failed to fetch instructors" });
  }
});

// CREATE course
router.post("/", authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const { name, description, code, credits, department, semester, courseType, capacity, room, schedule, scheduleDisplay, instructorId, instructorIds, prerequisiteIds, courseContent, hasLecture, hasTutorial, hasLab } = req.body;
    
    // Support both single instructorId (legacy) and instructorIds array
    const finalInstructorIds: string[] = instructorIds && Array.isArray(instructorIds) 
      ? instructorIds 
      : (instructorId ? [instructorId] : []);

    if (!name) {
      return res.status(400).json({ error: "Course name is required" });
    }

    // Create entity for course
    const course = await prisma.entity.create({
      data: {
        type: 'COURSE',
        name,
        description: description || '',
      }
    });

    // Create attributes if they don't exist and create values
    const attributeData = [
      { name: 'courseCode', value: code, dataType: 'STRING' },
      { name: 'credits', value: credits, dataType: 'NUMBER' },
      { name: 'department', value: department, dataType: 'STRING' },
      { name: 'semester', value: semester, dataType: 'STRING' },
      { name: 'courseType', value: courseType, dataType: 'STRING' },
      { name: 'capacity', value: capacity, dataType: 'NUMBER' },
      { name: 'room', value: room, dataType: 'STRING' },
      { name: 'schedule', value: schedule, dataType: 'STRING' },
      { name: 'scheduleDisplay', value: scheduleDisplay, dataType: 'STRING' },
      { name: 'courseContent', value: courseContent, dataType: 'TEXT' },
      { name: 'hasLecture', value: hasLecture, dataType: 'BOOLEAN' },
      { name: 'hasTutorial', value: hasTutorial, dataType: 'BOOLEAN' },
      { name: 'hasLab', value: hasLab, dataType: 'BOOLEAN' },
    ];

    for (const attrData of attributeData) {
      if (attrData.value !== undefined && attrData.value !== null && attrData.value !== '') {
        let attr = await prisma.attribute.findFirst({
          where: { name: attrData.name }
        });

        if (!attr) {
          attr = await prisma.attribute.create({
            data: {
              name: attrData.name,
              displayName: attrData.name.charAt(0).toUpperCase() + attrData.name.slice(1).replace(/([A-Z])/g, ' $1'),
              entityTypes: JSON.stringify(['COURSE']),
              dataType: attrData.dataType as any,
              category: 'ACADEMIC',
            }
          });
        }

        await prisma.value.create({
          data: {
            entityId: course.id,
            attributeId: attr.id,
            ...(attrData.dataType === 'NUMBER'
              ? { valueNumber: parseFloat(String(attrData.value)) }
              : attrData.dataType === 'TEXT'
                ? { valueText: String(attrData.value) }
                : attrData.dataType === 'BOOLEAN'
                  ? { valueBool: Boolean(attrData.value) }
                  : { valueString: String(attrData.value) }
            )
          }
        });
      }
    }

    // Assign instructors if provided
    if (finalInstructorIds.length > 0) {
      for (const instrId of finalInstructorIds) {
        await prisma.entityRelation.create({
          data: {
            fromEntityId: instrId,
            toEntityId: course.id,
            relationType: 'TEACHES',
            startDate: new Date()
          }
        });
      }
    }

    // Create prerequisite relations
    if (prerequisiteIds && Array.isArray(prerequisiteIds) && prerequisiteIds.length > 0) {
      for (const prereqId of prerequisiteIds) {
        await prisma.entityRelation.create({
          data: {
            fromEntityId: course.id,
            toEntityId: prereqId,
            relationType: 'PREREQUISITE',
            startDate: new Date()
          }
        });
      }
    }

    res.status(201).json({
      id: course.id,
      name: course.name,
      message: "Course created successfully"
    });
  } catch (error) {
    console.error("Create course error:", error);
    res.status(500).json({ error: "Failed to create course" });
  }
});

// UPDATE course
router.put("/:id", authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { name, description, isActive, code, credits, department, semester, courseType, capacity, room, schedule, scheduleDisplay, instructorId, instructorIds, prerequisiteIds, courseContent, hasLecture, hasTutorial, hasLab } = req.body;
    
    // Support both single instructorId (legacy) and instructorIds array
    const finalInstructorIds: string[] | undefined = instructorIds !== undefined 
      ? (Array.isArray(instructorIds) ? instructorIds : [])
      : (instructorId !== undefined ? (instructorId ? [instructorId] : []) : undefined);

    if (!id) {
      return res.status(400).json({ error: "Course ID is required" });
    }

    // Update entity
    const course = await prisma.entity.update({
      where: { id },
      data: {
        name: name || undefined,
        description: description || undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });

    // Update attribute values
    const attributeData = [
      { name: 'courseCode', value: code, dataType: 'STRING' },
      { name: 'credits', value: credits, dataType: 'NUMBER' },
      { name: 'department', value: department, dataType: 'STRING' },
      { name: 'semester', value: semester, dataType: 'STRING' },
      { name: 'courseType', value: courseType, dataType: 'STRING' },
      { name: 'capacity', value: capacity, dataType: 'NUMBER' },
      { name: 'room', value: room, dataType: 'STRING' },
      { name: 'schedule', value: schedule, dataType: 'STRING' },
      { name: 'scheduleDisplay', value: scheduleDisplay, dataType: 'STRING' },
      { name: 'courseContent', value: courseContent, dataType: 'TEXT' },
      { name: 'hasLecture', value: hasLecture, dataType: 'BOOLEAN' },
      { name: 'hasTutorial', value: hasTutorial, dataType: 'BOOLEAN' },
      { name: 'hasLab', value: hasLab, dataType: 'BOOLEAN' },
    ];

    for (const attrData of attributeData) {
      if (attrData.value !== undefined) {
        let attr = await prisma.attribute.findFirst({
          where: { name: attrData.name }
        });

        if (!attr) {
          attr = await prisma.attribute.create({
            data: {
              name: attrData.name,
              displayName: attrData.name.charAt(0).toUpperCase() + attrData.name.slice(1).replace(/([A-Z])/g, ' $1'),
              entityTypes: JSON.stringify(['COURSE']),
              dataType: attrData.dataType as any,
              category: 'ACADEMIC',
            }
          });
        }

        // Upsert value
        await prisma.value.upsert({
          where: {
            entityId_attributeId: {
              entityId: id,
              attributeId: attr.id
            }
          },
          update: {
            ...(attrData.dataType === 'NUMBER'
              ? { valueNumber: attrData.value !== '' ? parseFloat(String(attrData.value)) : null, valueString: null, valueText: null, valueBool: null }
              : attrData.dataType === 'TEXT'
                ? { valueText: String(attrData.value), valueNumber: null, valueString: null, valueBool: null }
                : attrData.dataType === 'BOOLEAN'
                  ? { valueBool: Boolean(attrData.value), valueNumber: null, valueString: null, valueText: null }
                  : { valueString: String(attrData.value), valueNumber: null, valueText: null, valueBool: null }
            )
          },
          create: {
            entityId: id,
            attributeId: attr.id,
            ...(attrData.dataType === 'NUMBER'
              ? { valueNumber: parseFloat(String(attrData.value)) }
              : attrData.dataType === 'TEXT'
                ? { valueText: String(attrData.value) }
                : attrData.dataType === 'BOOLEAN'
                  ? { valueBool: Boolean(attrData.value) }
                  : { valueString: String(attrData.value) }
            )
          }
        });
      }
    }

    // Update instructor assignments if provided
    if (finalInstructorIds !== undefined) {
      // Delete existing instructor relations completely
      await prisma.entityRelation.deleteMany({
        where: {
          toEntityId: id,
          relationType: 'TEACHES'
        }
      });

      // Add new instructors
      if (finalInstructorIds.length > 0) {
        for (const instrId of finalInstructorIds) {
          await prisma.entityRelation.create({
            data: {
              fromEntityId: instrId,
              toEntityId: id,
              relationType: 'TEACHES',
              startDate: new Date()
            }
          });
        }
      }
    }

    // Update prerequisite relations if provided
    if (prerequisiteIds !== undefined) {
      // Delete existing prerequisite relations completely
      await prisma.entityRelation.deleteMany({
        where: {
          fromEntityId: id,
          relationType: 'PREREQUISITE'
        }
      });

      // Add new prerequisites
      if (Array.isArray(prerequisiteIds) && prerequisiteIds.length > 0) {
        for (const prereqId of prerequisiteIds) {
          await prisma.entityRelation.create({
            data: {
              fromEntityId: id,
              toEntityId: prereqId,
              relationType: 'PREREQUISITE',
              startDate: new Date()
            }
          });
        }
      }
    }

    res.json({ ...course, message: "Course updated successfully" });
  } catch (error) {
    console.error("Update course error:", error);
    res.status(500).json({ error: "Failed to update course" });
  }
});

// DELETE course
router.delete("/:id", authenticateToken, requireAdminOrStaff, async (req, res) => {
  try {
    const id = req.params.id as string;

    if (!id) {
      return res.status(400).json({ error: "Course ID is required" });
    }

    // Delete values first
    await prisma.value.deleteMany({ where: { entityId: id } });
    // Delete relations
    await prisma.entityRelation.deleteMany({
      where: { OR: [{ fromEntityId: id }, { toEntityId: id }] }
    });
    // Delete entity
    await prisma.entity.delete({ where: { id } });

    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Delete course error:", error);
    res.status(500).json({ error: "Failed to delete course" });
  }
});

// ENROLL student in course
router.post("/:id/enroll", authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.id as string;
    let { studentId } = req.body;
    const user = (req as any).user;
    // If studentId is not provided, use current user
    if (!studentId) {
      // Find the user's entity via account relation
      const account = await prisma.account.findUnique({
        where: { id: user.id },
        include: { entity: true }
      });

      if (!account) {
        return res.status(400).json({ error: "Account not found" });
      }

      // If student doesn't have an entity, create one
      if (!account.entity) {
        const newEntity = await prisma.entity.create({
          data: {
            type: 'STUDENT',
            name: account.email.split('@')[0] || 'Student' // Use email prefix as initial name
          }
        });

        // Link entity to account
        await prisma.account.update({
          where: { id: account.id },
          data: { entityId: newEntity.id }
        });

        studentId = newEntity.id;
      } else {
        studentId = account.entity.id;
      }
    }

    // Check if already enrolled
    const existing = await prisma.entityRelation.findFirst({
      where: {
        fromEntityId: studentId,
        toEntityId: courseId,
        relationType: 'ENROLLED_IN',
        isActive: true
      }
    });
    if (existing) {
      return res.status(400).json({ error: "Student is already enrolled in this course" });
    }

    // Get the course and its prerequisites
    const course = await prisma.entity.findUnique({
      where: { id: courseId },
      include: {
        relationsFrom: {
          where: { relationType: 'PREREQUISITE', isActive: true },
          include: { toEntity: true }
        },
        values: { include: { attribute: true } }
      }
    });
    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Get all active enrollments for the student
    const activeEnrollments = await prisma.entityRelation.findMany({
      where: {
        fromEntityId: studentId,
        relationType: 'ENROLLED_IN',
        isActive: true
      },
      include: {
        toEntity: {
          include: { values: { include: { attribute: true } } }
        }
      }
    });

    // Calculate total credits
    let totalCredits = 0;
    for (const enr of activeEnrollments) {
      const courseVals = enr.toEntity.values;
      const creditsAttr = courseVals.find((v: any) => v.attribute.name === 'credits');
      if (creditsAttr) {
        totalCredits += Number(creditsAttr.valueNumber || creditsAttr.valueString || 0);
      }
    }
    // Credits for the course to enroll
    const thisCourseCreditsAttr = course.values.find((v: any) => v.attribute.name === 'credits');
    const thisCourseCredits = thisCourseCreditsAttr ? Number(thisCourseCreditsAttr.valueNumber || thisCourseCreditsAttr.valueString || 0) : 0;
    if (totalCredits + thisCourseCredits > 15) {
      return res.status(400).json({ error: "Credit hour limit exceeded. You can only take up to 15 credits per term." });
    }

    // Check prerequisites
    const prereqs = course.relationsFrom.map((r: any) => r.toEntity);
    if (prereqs.length > 0) {
      // Get all completed courses for the student (for now, treat enrolled as completed; you can add a 'finished' flag if needed)
      const completedCourseIds = new Set(activeEnrollments.map((enr: any) => enr.toEntity.id));
      const missing = prereqs.filter((pr: any) => !completedCourseIds.has(pr.id));
      if (missing.length > 0) {
        return res.status(400).json({ error: `Missing prerequisites: ${missing.map((m: any) => m.name).join(', ')}` });
      }
    }

    // Enroll
    const enrollment = await prisma.entityRelation.create({
      data: {
        fromEntityId: studentId,
        toEntityId: courseId,
        relationType: 'ENROLLED_IN',
        startDate: new Date(),
        metadata: JSON.stringify({ enrolledAt: new Date().toISOString() })
      }
    });

    res.status(201).json({ message: "Student enrolled successfully", enrollmentId: enrollment.id });
  } catch (error) {
    console.error("Enroll student error:", error);
    res.status(500).json({ error: "Failed to enroll student" });
  }
});

// UNENROLL student from course
router.delete("/:id/unenroll/:studentId", authenticateToken, async (req, res) => {
  try {
    const courseId = req.params.id as string;
    const studentId = req.params.studentId as string;

    const result = await prisma.entityRelation.updateMany({
      where: {
        fromEntityId: studentId,
        toEntityId: courseId,
        relationType: 'ENROLLED_IN',
        isActive: true
      },
      data: { isActive: false, endDate: new Date() }
    });

    if (result.count === 0) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    res.json({ message: "Student unenrolled successfully" });
  } catch (error) {
    console.error("Unenroll student error:", error);
    res.status(500).json({ error: "Failed to unenroll student" });
  }
});

// GET course statistics
router.get("/stats/overview", authenticateToken, async (req, res) => {
  try {
    const totalCourses = await prisma.entity.count({ where: { type: 'COURSE' } });
    const activeCourses = await prisma.entity.count({ where: { type: 'COURSE', isActive: true } });
    const totalEnrollments = await prisma.entityRelation.count({
      where: { relationType: 'ENROLLED_IN', isActive: true }
    });
    const totalInstructors = await prisma.entityRelation.count({
      where: { relationType: 'TEACHES', isActive: true }
    });

    // Get departments (unique values)
    const courses = await prisma.entity.findMany({
      where: { type: 'COURSE' },
      include: {
        values: {
          where: { attribute: { name: 'department' } },
          include: { attribute: true }
        }
      }
    });

    const departments = new Set(
      courses.flatMap((c: any) => c.values.map((v: any) => v.valueString).filter(Boolean))
    );

    res.json({
      totalCourses,
      activeCourses,
      inactiveCourses: totalCourses - activeCourses,
      totalEnrollments,
      totalInstructors,
      departmentCount: departments.size
    });
  } catch (error) {
    console.error("Get course stats error:", error);
    res.status(500).json({ error: "Failed to fetch course statistics" });
  }
});

export const curriculumRouter = router;
