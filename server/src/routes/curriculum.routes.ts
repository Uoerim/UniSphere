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

// GET all courses
router.get("/", authenticateToken, async (req, res) => {
  try {
    const courses = await prisma.entity.findMany({
      where: { type: 'COURSE' },
      include: {
        values: {
          include: { attribute: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedCourses = courses.map(course => {
      const attrs: Record<string, string | number | boolean | Date | null> = {};
      course.values.forEach(v => {
        attrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
      });
      return {
        id: course.id,
        name: course.name,
        description: course.description,
        isActive: course.isActive,
        createdAt: course.createdAt,
        ...attrs
      };
    });

    res.json(formattedCourses);
  } catch (error) {
    console.error("Get courses error:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

// GET single course
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Course ID is required" });
    }
    const course = await prisma.entity.findUnique({
      where: { id },
      include: {
        values: { include: { attribute: true } }
      }
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const attrs: Record<string, string | number | boolean | Date | null> = {};
    course.values.forEach(v => {
      attrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
    });

    res.json({
      id: course.id,
      name: course.name,
      description: course.description,
      isActive: course.isActive,
      createdAt: course.createdAt,
      ...attrs
    });
  } catch (error) {
    console.error("Get course error:", error);
    res.status(500).json({ error: "Failed to fetch course" });
  }
});

// CREATE course
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { name, description, code, credits, department, semester, type } = req.body;

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
      { name: 'courseType', value: type, dataType: 'STRING' },
    ];

    for (const attrData of attributeData) {
      if (attrData.value) {
        let attr = await prisma.attribute.findFirst({ 
          where: { name: attrData.name } 
        });
        
        if (!attr) {
          attr = await prisma.attribute.create({
            data: {
              name: attrData.name,
              displayName: attrData.name.charAt(0).toUpperCase() + attrData.name.slice(1),
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
              ? { valueNumber: parseFloat(attrData.value) } 
              : { valueString: attrData.value }
            )
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
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Course ID is required" });
    }

    const course = await prisma.entity.update({
      where: { id },
      data: { name, description, isActive }
    });

    res.json(course);
  } catch (error) {
    console.error("Update course error:", error);
    res.status(500).json({ error: "Failed to update course" });
  }
});

// DELETE course
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

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

export const curriculumRouter = router;
