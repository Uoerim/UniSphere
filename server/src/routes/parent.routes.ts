import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
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

// Helper function to generate a temporary password
const generateTempPassword = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// GET all parents
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const parents = await prisma.account.findMany({
      where: { role: 'PARENT' },
      include: {
        entity: {
          include: {
            values: { include: { attribute: true } },
            relationsFrom: {
              where: { relationType: 'PARENT_OF', isActive: true },
              include: {
                toEntity: {
                  include: {
                    values: { include: { attribute: true } },
                    account: { select: { email: true, id: true } }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = parents.map(parent => {
      const attrs: Record<string, any> = {};
      if (parent.entity) {
        parent.entity.values.forEach(v => {
          attrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
        });
      }

      // Get children
      const children = parent.entity?.relationsFrom
        .filter(r => r.relationType === 'PARENT_OF')
        .map(r => {
          const childAttrs: Record<string, any> = {};
          r.toEntity.values.forEach(v => {
            childAttrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
          });
          return {
            id: r.toEntity.id,
            accountId: r.toEntity.account?.id,
            name: childAttrs.firstName && childAttrs.lastName 
              ? `${childAttrs.firstName} ${childAttrs.lastName}` 
              : r.toEntity.account?.email || 'Unknown',
            email: r.toEntity.account?.email,
            grade: childAttrs.grade || childAttrs.gradeLevel,
            relationId: r.id
          };
        }) || [];

      return {
        id: parent.id,
        entityId: parent.entity?.id,
        email: parent.email,
        isActive: parent.isActive,
        mustChangePassword: parent.mustChangePassword,
        tempPassword: parent.tempPassword,
        createdAt: parent.createdAt,
        lastLogin: parent.lastLogin,
        firstName: attrs.firstName,
        lastName: attrs.lastName,
        phone: attrs.phone,
        phoneCountryCode: attrs.phoneCountryCode,
        address: attrs.address,
        occupation: attrs.occupation,
        relationship: attrs.relationship, // e.g., "Father", "Mother", "Guardian"
        children,
        childCount: children.length
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error("Get parents error:", error);
    res.status(500).json({ error: "Failed to fetch parents" });
  }
});

// GET single parent by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const parent = await prisma.account.findUnique({
      where: { id },
      include: {
        entity: {
          include: {
            values: { include: { attribute: true } },
            relationsFrom: {
              where: { relationType: 'PARENT_OF', isActive: true },
              include: {
                toEntity: {
                  include: {
                    values: { include: { attribute: true } },
                    account: { select: { email: true, id: true } },
                    relationsFrom: {
                      where: { relationType: 'ENROLLED_IN', isActive: true },
                      include: {
                        toEntity: {
                          include: { values: { include: { attribute: true } } }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!parent || parent.role !== 'PARENT') {
      return res.status(404).json({ error: "Parent not found" });
    }

    const attrs: Record<string, any> = {};
    if (parent.entity) {
      parent.entity.values.forEach(v => {
        attrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
      });
    }

    // Get children with their courses
    const children = parent.entity?.relationsFrom
      .filter(r => r.relationType === 'PARENT_OF')
      .map(r => {
        const childAttrs: Record<string, any> = {};
        r.toEntity.values.forEach(v => {
          childAttrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
        });

        // Get child's courses
        const courses = r.toEntity.relationsFrom
          .filter(cr => cr.relationType === 'ENROLLED_IN')
          .map(cr => {
            const courseAttrs: Record<string, any> = {};
            cr.toEntity.values.forEach(v => {
              courseAttrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
            });
            return {
              id: cr.toEntity.id,
              name: cr.toEntity.name,
              code: courseAttrs.courseCode || courseAttrs.code
            };
          });

        return {
          id: r.toEntity.id,
          accountId: r.toEntity.account?.id,
          name: childAttrs.firstName && childAttrs.lastName 
            ? `${childAttrs.firstName} ${childAttrs.lastName}` 
            : r.toEntity.account?.email || 'Unknown',
          email: r.toEntity.account?.email,
          grade: childAttrs.grade || childAttrs.gradeLevel,
          courses,
          relationId: r.id
        };
      }) || [];

    res.json({
      id: parent.id,
      entityId: parent.entity?.id,
      email: parent.email,
      isActive: parent.isActive,
      createdAt: parent.createdAt,
      lastLogin: parent.lastLogin,
      ...attrs,
      children
    });
  } catch (error) {
    console.error("Get parent error:", error);
    res.status(500).json({ error: "Failed to fetch parent" });
  }
});

// GET parent stats
router.get("/stats/overview", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalParents = await prisma.account.count({ where: { role: 'PARENT' } });
    const activeParents = await prisma.account.count({ where: { role: 'PARENT', isActive: true } });
    
    // Count parent-child relationships
    const parentEntities = await prisma.entity.findMany({
      where: { type: 'PARENT' },
      include: {
        relationsFrom: { where: { relationType: 'PARENT_OF', isActive: true } }
      }
    });

    const totalChildren = parentEntities.reduce((sum, p) => sum + p.relationsFrom.length, 0);
    const averageChildren = totalParents > 0 ? totalChildren / totalParents : 0;

    res.json({
      totalParents,
      activeParents,
      totalChildren,
      averageChildren
    });
  } catch (error) {
    console.error("Get parent stats error:", error);
    res.status(500).json({ error: "Failed to fetch parent stats" });
  }
});

// GET available students (for connecting to parents)
router.get("/available/students", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const students = await prisma.account.findMany({
      where: { role: 'STUDENT', isActive: true },
      include: {
        entity: {
          include: {
            values: { include: { attribute: true } }
          }
        }
      },
      orderBy: { email: 'asc' }
    });

    const formatted = students.map(student => {
      const attrs: Record<string, any> = {};
      if (student.entity) {
        student.entity.values.forEach(v => {
          attrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
        });
      }
      return {
        id: student.id,
        entityId: student.entity?.id,
        email: student.email,
        name: attrs.firstName && attrs.lastName 
          ? `${attrs.firstName} ${attrs.lastName}` 
          : student.email,
        grade: attrs.grade || attrs.gradeLevel
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error("Get available students error:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// CREATE parent
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      email, firstName, lastName, phone, phoneCountryCode, 
      address, occupation, relationship, childIds 
    } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if email exists
    const existing = await prisma.account.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email already in use" });
    }

    // Generate temp password
    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Create entity first
    const entity = await prisma.entity.create({
      data: {
        type: 'PARENT',
        name: firstName && lastName ? `${firstName} ${lastName}` : email
      }
    });

    // Create account linked to entity
    const parent = await prisma.account.create({
      data: {
        email,
        password: hashedPassword,
        role: 'PARENT',
        isActive: true,
        mustChangePassword: true,
        tempPassword,
        entityId: entity.id
      }
    });

    // Create attribute values
    const attributeConfigs = [
      { name: 'firstName', value: firstName, dataType: 'STRING' as const },
      { name: 'lastName', value: lastName, dataType: 'STRING' as const },
      { name: 'phone', value: phone, dataType: 'PHONE' as const },
      { name: 'phoneCountryCode', value: phoneCountryCode, dataType: 'STRING' as const },
      { name: 'address', value: address, dataType: 'TEXT' as const },
      { name: 'occupation', value: occupation, dataType: 'STRING' as const },
      { name: 'relationship', value: relationship, dataType: 'STRING' as const }
    ];

    for (const config of attributeConfigs) {
      if (config.value) {
        let attr = await prisma.attribute.findFirst({ where: { name: config.name } });
        if (!attr) {
          attr = await prisma.attribute.create({
            data: {
              name: config.name,
              displayName: config.name.charAt(0).toUpperCase() + config.name.slice(1),
              entityTypes: JSON.stringify(['PARENT', 'STUDENT', 'STAFF']),
              dataType: config.dataType,
              category: 'PERSONAL'
            }
          });
        }
        await prisma.value.create({
          data: {
            entityId: entity.id,
            attributeId: attr.id,
            valueString: String(config.value)
          }
        });
      }
    }

    // Connect to children if provided
    if (childIds && Array.isArray(childIds)) {
      for (const childId of childIds) {
        // Find the student's entity
        const studentAccount = await prisma.account.findUnique({
          where: { id: childId },
          include: { entity: true }
        });

        if (studentAccount?.entity) {
          await prisma.entityRelation.create({
            data: {
              fromEntityId: entity.id,
              toEntityId: studentAccount.entity.id,
              relationType: 'PARENT_OF',
              isActive: true
            }
          });
        }
      }
    }

    res.status(201).json({ 
      id: parent.id, 
      email: parent.email,
      tempPassword,
      message: "Parent created successfully" 
    });
  } catch (error) {
    console.error("Create parent error:", error);
    res.status(500).json({ error: "Failed to create parent" });
  }
});

// UPDATE parent (supports both PUT and PATCH)
router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      email, isActive, firstName, lastName, phone, phoneCountryCode,
      address, occupation, relationship, password
    } = req.body;

    // Update account
    const updateData: any = {};
    if (email !== undefined) updateData.email = email;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const parent = await prisma.account.update({
      where: { id },
      data: updateData,
      include: { entity: true }
    });

    // Update entity name if names provided
    if ((firstName || lastName) && parent.entity) {
      await prisma.entity.update({
        where: { id: parent.entity.id },
        data: { name: `${firstName || ''} ${lastName || ''}`.trim() || parent.email }
      });
    }

    // Update attribute values
    if (parent.entity) {
      const attributeUpdates = [
        { name: 'firstName', value: firstName },
        { name: 'lastName', value: lastName },
        { name: 'phone', value: phone },
        { name: 'phoneCountryCode', value: phoneCountryCode },
        { name: 'address', value: address },
        { name: 'occupation', value: occupation },
        { name: 'relationship', value: relationship }
      ];

      for (const update of attributeUpdates) {
        if (update.value !== undefined) {
          let attr = await prisma.attribute.findFirst({ where: { name: update.name } });
          if (!attr) {
            attr = await prisma.attribute.create({
              data: {
                name: update.name,
                displayName: update.name.charAt(0).toUpperCase() + update.name.slice(1),
                entityTypes: JSON.stringify(['PARENT', 'STUDENT', 'STAFF']),
                dataType: 'STRING',
                category: 'PERSONAL'
              }
            });
          }
          await prisma.value.upsert({
            where: {
              entityId_attributeId: { entityId: parent.entity.id, attributeId: attr.id }
            },
            update: { valueString: String(update.value) },
            create: {
              entityId: parent.entity.id,
              attributeId: attr.id,
              valueString: String(update.value)
            }
          });
        }
      }
    }

    res.json({ id: parent.id, message: "Parent updated successfully" });
  } catch (error) {
    console.error("Update parent error:", error);
    res.status(500).json({ error: "Failed to update parent" });
  }
});

// UPDATE parent
router.patch("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      email, isActive, firstName, lastName, phone, phoneCountryCode,
      address, occupation, relationship 
    } = req.body;

    // Update account
    const updateData: any = {};
    if (email !== undefined) updateData.email = email;
    if (isActive !== undefined) updateData.isActive = isActive;

    const parent = await prisma.account.update({
      where: { id },
      data: updateData,
      include: { entity: true }
    });

    // Update entity name if names provided
    if ((firstName || lastName) && parent.entity) {
      await prisma.entity.update({
        where: { id: parent.entity.id },
        data: { name: `${firstName || ''} ${lastName || ''}`.trim() || parent.email }
      });
    }

    // Update attribute values
    if (parent.entity) {
      const attributeUpdates = [
        { name: 'firstName', value: firstName },
        { name: 'lastName', value: lastName },
        { name: 'phone', value: phone },
        { name: 'phoneCountryCode', value: phoneCountryCode },
        { name: 'address', value: address },
        { name: 'occupation', value: occupation },
        { name: 'relationship', value: relationship }
      ];

      for (const update of attributeUpdates) {
        if (update.value !== undefined) {
          const attr = await prisma.attribute.findFirst({ where: { name: update.name } });
          if (attr) {
            await prisma.value.upsert({
              where: {
                entityId_attributeId: { entityId: parent.entity.id, attributeId: attr.id }
              },
              update: { valueString: String(update.value) },
              create: {
                entityId: parent.entity.id,
                attributeId: attr.id,
                valueString: String(update.value)
              }
            });
          }
        }
      }
    }

    res.json({ id: parent.id, message: "Parent updated successfully" });
  } catch (error) {
    console.error("Update parent error:", error);
    res.status(500).json({ error: "Failed to update parent" });
  }
});

// DELETE parent
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const parent = await prisma.account.findUnique({
      where: { id },
      include: { entity: true }
    });

    if (!parent) {
      return res.status(404).json({ error: "Parent not found" });
    }

    // Delete entity relations and values if entity exists
    if (parent.entity) {
      await prisma.entityRelation.deleteMany({
        where: { OR: [{ fromEntityId: parent.entity.id }, { toEntityId: parent.entity.id }] }
      });
      await prisma.value.deleteMany({ where: { entityId: parent.entity.id } });
    }

    // Delete account (entity will be orphaned but that's ok, or we can delete it)
    await prisma.account.delete({ where: { id } });

    // Delete entity if exists
    if (parent.entity) {
      await prisma.entity.delete({ where: { id: parent.entity.id } });
    }

    res.json({ message: "Parent deleted successfully" });
  } catch (error) {
    console.error("Delete parent error:", error);
    res.status(500).json({ error: "Failed to delete parent" });
  }
});

// Connect child to parent
router.post("/:id/children", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const parentId = req.params.id;
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: "Student ID is required" });
    }

    // Get parent's entity
    const parentAccount = await prisma.account.findUnique({
      where: { id: parentId },
      include: { entity: true }
    });

    if (!parentAccount?.entity) {
      return res.status(404).json({ error: "Parent entity not found" });
    }

    // Get student's entity
    const studentAccount = await prisma.account.findUnique({
      where: { id: studentId },
      include: { entity: true }
    });

    if (!studentAccount?.entity) {
      return res.status(404).json({ error: "Student entity not found" });
    }

    // Check if relation already exists
    const existing = await prisma.entityRelation.findFirst({
      where: {
        fromEntityId: parentAccount.entity.id,
        toEntityId: studentAccount.entity.id,
        relationType: 'PARENT_OF'
      }
    });

    if (existing) {
      if (!existing.isActive) {
        await prisma.entityRelation.update({
          where: { id: existing.id },
          data: { isActive: true }
        });
        return res.json({ message: "Child connection reactivated" });
      }
      return res.json({ message: "Child already connected to parent" });
    }

    await prisma.entityRelation.create({
      data: {
        fromEntityId: parentAccount.entity.id,
        toEntityId: studentAccount.entity.id,
        relationType: 'PARENT_OF',
        isActive: true
      }
    });

    res.json({ message: "Child connected to parent successfully" });
  } catch (error) {
    console.error("Connect child to parent error:", error);
    res.status(500).json({ error: "Failed to connect child to parent" });
  }
});

// Disconnect child from parent
router.delete("/:id/children/:studentId", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id: parentId, studentId } = req.params;

    // Get parent's entity
    const parentAccount = await prisma.account.findUnique({
      where: { id: parentId },
      include: { entity: true }
    });

    if (!parentAccount?.entity) {
      return res.status(404).json({ error: "Parent entity not found" });
    }

    // Get student's entity
    const studentAccount = await prisma.account.findUnique({
      where: { id: studentId },
      include: { entity: true }
    });

    if (!studentAccount?.entity) {
      return res.status(404).json({ error: "Student entity not found" });
    }

    await prisma.entityRelation.updateMany({
      where: {
        fromEntityId: parentAccount.entity.id,
        toEntityId: studentAccount.entity.id,
        relationType: 'PARENT_OF'
      },
      data: { isActive: false }
    });

    res.json({ message: "Child disconnected from parent successfully" });
  } catch (error) {
    console.error("Disconnect child from parent error:", error);
    res.status(500).json({ error: "Failed to disconnect child from parent" });
  }
});

// Reset parent password
router.post("/:id/reset-password", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const tempPassword = generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await prisma.account.update({
      where: { id },
      data: {
        password: hashedPassword,
        tempPassword,
        mustChangePassword: true
      }
    });

    res.json({ tempPassword, message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset parent password error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

export const parentRouter = router;
