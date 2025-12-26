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

// Admin only middleware
const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  if (!user || user.role !== "ADMIN") {
    return res.status(403).json({ error: "Access denied. Admin role required." });
  }
  next();
};

// GET all departments
router.get("/", authenticateToken, async (req, res) => {
  try {
    const departments = await prisma.entity.findMany({
      where: { type: 'DEPARTMENT' },
      include: {
        values: { include: { attribute: true } },
        children: {
          include: {
            values: { include: { attribute: true } }
          }
        },
        relationsFrom: {
          where: { relationType: 'BELONGS_TO', isActive: true },
          include: {
            toEntity: {
              include: { values: { include: { attribute: true } } }
            }
          }
        },
        relationsTo: {
          where: { isActive: true },
          include: {
            fromEntity: {
              include: { values: { include: { attribute: true } } }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    const formatted = departments.map(dept => {
      const attrs: Record<string, any> = {};
      dept.values.forEach(v => {
        attrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
      });

      // Count courses in this department
      const courseCount = dept.relationsTo.filter(r => 
        r.relationType === 'BELONGS_TO' && r.fromEntity.type === 'COURSE'
      ).length;

      // Count staff in this department
      const staffCount = dept.relationsTo.filter(r => 
        r.relationType === 'WORKS_IN' && r.fromEntity.type === 'STAFF'
      ).length;

      return {
        id: dept.id,
        name: dept.name,
        description: dept.description,
        isActive: dept.isActive,
        createdAt: dept.createdAt,
        code: attrs.code || attrs.departmentCode,
        head: attrs.head || attrs.departmentHead,
        email: attrs.email,
        courseCount,
        staffCount,
        ...attrs
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error("Get departments error:", error);
    res.status(500).json({ error: "Failed to fetch departments" });
  }
});

// GET single department by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const department = await prisma.entity.findUnique({
      where: { id },
      include: {
        values: { include: { attribute: true } },
        relationsTo: {
          where: { isActive: true },
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

    if (!department || department.type !== 'DEPARTMENT') {
      return res.status(404).json({ error: "Department not found" });
    }

    const attrs: Record<string, any> = {};
    department.values.forEach(v => {
      attrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
    });

    // Get courses
    const courses = department.relationsTo
      .filter(r => r.relationType === 'BELONGS_TO' && r.fromEntity.type === 'COURSE')
      .map(r => {
        const courseAttrs: Record<string, any> = {};
        r.fromEntity.values.forEach(v => {
          courseAttrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
        });
        return {
          id: r.fromEntity.id,
          name: r.fromEntity.name,
          code: courseAttrs.courseCode || courseAttrs.code,
          credits: courseAttrs.credits,
          isActive: r.fromEntity.isActive
        };
      });

    // Get staff
    const staff = department.relationsTo
      .filter(r => r.relationType === 'WORKS_IN' && r.fromEntity.type === 'STAFF')
      .map(r => {
        const staffAttrs: Record<string, any> = {};
        r.fromEntity.values.forEach(v => {
          staffAttrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
        });
        return {
          id: r.fromEntity.id,
          name: staffAttrs.firstName && staffAttrs.lastName 
            ? `${staffAttrs.firstName} ${staffAttrs.lastName}`
            : r.fromEntity.account?.email || 'Unknown',
          email: r.fromEntity.account?.email,
          position: staffAttrs.position
        };
      });

    res.json({
      id: department.id,
      name: department.name,
      description: department.description,
      isActive: department.isActive,
      createdAt: department.createdAt,
      ...attrs,
      courses,
      staff
    });
  } catch (error) {
    console.error("Get department error:", error);
    res.status(500).json({ error: "Failed to fetch department" });
  }
});

// GET department stats
router.get("/stats/overview", authenticateToken, async (req, res) => {
  try {
    const departments = await prisma.entity.findMany({
      where: { type: 'DEPARTMENT' },
      include: {
        relationsTo: {
          where: { isActive: true }
        }
      }
    });

    const totalDepartments = departments.length;
    const activeDepartments = departments.filter(d => d.isActive).length;
    
    // Count total courses across all departments
    const totalCourses = departments.reduce((sum, dept) => {
      return sum + dept.relationsTo.filter(r => r.relationType === 'BELONGS_TO').length;
    }, 0);

    // Count total staff across all departments
    const totalStaff = departments.reduce((sum, dept) => {
      return sum + dept.relationsTo.filter(r => r.relationType === 'WORKS_IN').length;
    }, 0);

    res.json({
      totalDepartments,
      activeDepartments,
      totalCourses,
      totalStaff
    });
  } catch (error) {
    console.error("Get department stats error:", error);
    res.status(500).json({ error: "Failed to fetch department stats" });
  }
});

// CREATE department
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, code, head, email } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Department name is required" });
    }

    // Create entity for department
    const department = await prisma.entity.create({
      data: {
        type: 'DEPARTMENT',
        name,
        description
      }
    });

    // Get or create attributes
    const attributeConfigs = [
      { name: 'code', dataType: 'STRING' as const, displayName: 'Department Code' },
      { name: 'head', dataType: 'STRING' as const, displayName: 'Department Head' },
      { name: 'email', dataType: 'EMAIL' as const, displayName: 'Email' }
    ];

    const attributes = await Promise.all(
      attributeConfigs.map(async (config) => {
        let attr = await prisma.attribute.findFirst({ where: { name: config.name } });
        if (!attr) {
          attr = await prisma.attribute.create({
            data: {
              name: config.name,
              displayName: config.displayName,
              entityTypes: JSON.stringify(['DEPARTMENT']),
              dataType: config.dataType,
              category: 'FACILITY'
            }
          });
        }
        return { ...attr, configValue: config.name === 'code' ? code : 
                  config.name === 'head' ? head : email };
      })
    );

    // Create values
    const valuesToCreate = attributes
      .filter(attr => attr.configValue)
      .map(attr => ({
        attributeId: attr.id,
        entityId: department.id,
        valueString: String(attr.configValue)
      }));

    if (valuesToCreate.length > 0) {
      await prisma.value.createMany({ data: valuesToCreate });
    }

    res.status(201).json({ 
      id: department.id, 
      name: department.name, 
      message: "Department created successfully" 
    });
  } catch (error) {
    console.error("Create department error:", error);
    res.status(500).json({ error: "Failed to create department" });
  }
});

// UPDATE department
router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive, code, head, email } = req.body;

    // Update entity
    const department = await prisma.entity.update({
      where: { id },
      data: { 
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });

    // Update attribute values
    const attributeUpdates = [
      { name: 'code', value: code },
      { name: 'head', value: head },
      { name: 'email', value: email }
    ];

    for (const update of attributeUpdates) {
      if (update.value !== undefined) {
        const attr = await prisma.attribute.findFirst({ where: { name: update.name } });
        if (attr) {
          await prisma.value.upsert({
            where: {
              entityId_attributeId: { entityId: id, attributeId: attr.id }
            },
            update: { valueString: String(update.value) },
            create: {
              entityId: id,
              attributeId: attr.id,
              valueString: String(update.value)
            }
          });
        }
      }
    }

    res.json({ id: department.id, message: "Department updated successfully" });
  } catch (error) {
    console.error("Update department error:", error);
    res.status(500).json({ error: "Failed to update department" });
  }
});

// DELETE department
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if department has courses or staff
    const relations = await prisma.entityRelation.findMany({
      where: { toEntityId: id, isActive: true }
    });

    if (relations.length > 0) {
      return res.status(400).json({ 
        error: "Cannot delete department with active courses or staff. Remove them first or deactivate the department." 
      });
    }

    // Delete values first
    await prisma.value.deleteMany({ where: { entityId: id } });
    // Delete any relations
    await prisma.entityRelation.deleteMany({
      where: { OR: [{ fromEntityId: id }, { toEntityId: id }] }
    });
    // Delete entity
    await prisma.entity.delete({ where: { id } });

    res.json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("Delete department error:", error);
    res.status(500).json({ error: "Failed to delete department" });
  }
});

// Assign course to department
router.post("/:id/courses", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const departmentId = req.params.id;
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ error: "Course ID is required" });
    }

    // Check if relation already exists
    const existing = await prisma.entityRelation.findFirst({
      where: {
        fromEntityId: courseId,
        toEntityId: departmentId,
        relationType: 'BELONGS_TO'
      }
    });

    if (existing) {
      // Reactivate if inactive
      if (!existing.isActive) {
        await prisma.entityRelation.update({
          where: { id: existing.id },
          data: { isActive: true }
        });
      }
      return res.json({ message: "Course already assigned to department" });
    }

    await prisma.entityRelation.create({
      data: {
        fromEntityId: courseId,
        toEntityId: departmentId,
        relationType: 'BELONGS_TO',
        isActive: true
      }
    });

    res.json({ message: "Course assigned to department successfully" });
  } catch (error) {
    console.error("Assign course to department error:", error);
    res.status(500).json({ error: "Failed to assign course to department" });
  }
});

// Remove course from department
router.delete("/:id/courses/:courseId", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id: departmentId, courseId } = req.params;

    await prisma.entityRelation.updateMany({
      where: {
        fromEntityId: courseId,
        toEntityId: departmentId,
        relationType: 'BELONGS_TO'
      },
      data: { isActive: false }
    });

    res.json({ message: "Course removed from department successfully" });
  } catch (error) {
    console.error("Remove course from department error:", error);
    res.status(500).json({ error: "Failed to remove course from department" });
  }
});

// Assign staff to department
router.post("/:id/staff", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const departmentId = req.params.id;
    const { staffId } = req.body;

    if (!staffId) {
      return res.status(400).json({ error: "Staff ID is required" });
    }

    // Check if relation already exists
    const existing = await prisma.entityRelation.findFirst({
      where: {
        fromEntityId: staffId,
        toEntityId: departmentId,
        relationType: 'WORKS_IN'
      }
    });

    if (existing) {
      if (!existing.isActive) {
        await prisma.entityRelation.update({
          where: { id: existing.id },
          data: { isActive: true }
        });
      }
      return res.json({ message: "Staff already assigned to department" });
    }

    await prisma.entityRelation.create({
      data: {
        fromEntityId: staffId,
        toEntityId: departmentId,
        relationType: 'WORKS_IN',
        isActive: true
      }
    });

    res.json({ message: "Staff assigned to department successfully" });
  } catch (error) {
    console.error("Assign staff to department error:", error);
    res.status(500).json({ error: "Failed to assign staff to department" });
  }
});

// Remove staff from department
router.delete("/:id/staff/:staffId", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id: departmentId, staffId } = req.params;

    await prisma.entityRelation.updateMany({
      where: {
        fromEntityId: staffId,
        toEntityId: departmentId,
        relationType: 'WORKS_IN'
      },
      data: { isActive: false }
    });

    res.json({ message: "Staff removed from department successfully" });
  } catch (error) {
    console.error("Remove staff from department error:", error);
    res.status(500).json({ error: "Failed to remove staff from department" });
  }
});

export const departmentRouter = router;
