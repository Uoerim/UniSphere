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

// ============ ANNOUNCEMENTS ============

// GET all announcements
router.get("/announcements", authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;

    // Collect course scopes based on role
    let enrolledCourseIds: string[] = [];
    let staffCourseIds: string[] = [];

    const account = await prisma.account.findUnique({
      where: { id: user.id },
      include: { entity: true }
    });

    if (account?.entity) {
      if (user.role === 'STUDENT') {
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

      if (user.role === 'STAFF') {
        const teaches = await prisma.entityRelation.findMany({
          where: {
            fromEntityId: account.entity.id,
            relationType: 'TEACHES',
            isActive: true
          },
          select: { toEntityId: true }
        });
        staffCourseIds = teaches.map(t => t.toEntityId);
      }
    }

    const announcements = await prisma.entity.findMany({
      where: { type: 'ANNOUNCEMENT' },
      include: {
        values: { include: { attribute: true } },
        relationsFrom: {
          where: { relationType: 'ANNOUNCEMENT_FOR', isActive: true },
          include: {
            toEntity: {
              include: { values: { include: { attribute: true } } }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = announcements.map(ann => {
      const attrs: Record<string, string | number | boolean | Date | null> = {};
      ann.values.forEach(v => {
        attrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
      });

      const courseRel = ann.relationsFrom.find(r => r.relationType === 'ANNOUNCEMENT_FOR');
      let course = null as null | { id: string; name: string; code?: string | number | boolean | Date | null };
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
        id: ann.id,
        title: ann.name,
        content: ann.description,
        isActive: ann.isActive,
        createdAt: ann.createdAt,
        course,
        ...attrs
      };
    });

    const filtered = formatted.filter(ann => {
      if (!ann.course) return user.role !== 'STUDENT' && user.role !== 'STAFF';
      if (user.role === 'STUDENT' && enrolledCourseIds.length > 0) {
        return enrolledCourseIds.includes(ann.course.id);
      }
      if (user.role === 'STAFF' && staffCourseIds.length > 0) {
        return staffCourseIds.includes(ann.course.id);
      }
      return true;
    });

    res.json(filtered);
  } catch (error) {
    console.error("Get announcements error:", error);
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
});

// CREATE announcement
router.post("/announcements", authenticateToken, async (req, res) => {
  try {
    const { title, content, priority, targetAudience, courseId } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    if (!courseId) {
      return res.status(400).json({ error: "Course is required" });
    }

    const announcement = await prisma.entity.create({
      data: {
        type: 'ANNOUNCEMENT',
        name: title,
        description: content || '',
      }
    });

    // Link to course if provided
    if (courseId) {
      const course = await prisma.entity.findFirst({ where: { id: courseId, type: 'COURSE' } });
      if (course) {
        await prisma.entityRelation.create({
          data: {
            fromEntityId: announcement.id,
            toEntityId: courseId,
            relationType: 'ANNOUNCEMENT_FOR',
            isActive: true
          }
        });
      } else {
        // Rollback: delete the announcement if course not found
        await prisma.entity.delete({ where: { id: announcement.id } });
        return res.status(400).json({ error: "Invalid course ID" });
      }
    }

    // Create attributes for priority and target
    if (priority) {
      let attr = await prisma.attribute.findFirst({
        where: { name: 'priority' }
      });
      if (!attr) {
        attr = await prisma.attribute.create({
          data: {
            name: 'priority',
            displayName: 'Priority',
            entityTypes: JSON.stringify(['ANNOUNCEMENT']),
            dataType: 'STRING',
            category: 'SYSTEM',
          }
        });
      }
      await prisma.value.create({
        data: { entityId: announcement.id, attributeId: attr.id, valueString: priority }
      });
    }

    if (targetAudience) {
      let attr = await prisma.attribute.findFirst({
        where: { name: 'targetAudience' }
      });
      if (!attr) {
        attr = await prisma.attribute.create({
          data: {
            name: 'targetAudience',
            displayName: 'Target Audience',
            entityTypes: JSON.stringify(['ANNOUNCEMENT']),
            dataType: 'STRING',
            category: 'SYSTEM',
          }
        });
      }
      await prisma.value.create({
        data: { entityId: announcement.id, attributeId: attr.id, valueString: targetAudience }
      });
    }

    res.status(201).json({
      id: announcement.id,
      title: announcement.name,
      message: "Announcement created successfully"
    });
  } catch (error) {
    console.error("Create announcement error:", error);
    res.status(500).json({ error: "Failed to create announcement" });
  }
});

// UPDATE announcement
router.put("/announcements/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, priority, targetAudience, isActive, courseId } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Announcement ID is required" });
    }

    // Update entity
    const announcement = await prisma.entity.update({
      where: { id },
      data: {
        name: title !== undefined ? title : undefined,
        description: content !== undefined ? content : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });

    // Update priority attribute
    if (priority !== undefined) {
      let attr = await prisma.attribute.findFirst({ where: { name: 'priority' } });
      if (attr) {
        await prisma.value.upsert({
          where: { entityId_attributeId: { entityId: id, attributeId: attr.id } },
          update: { valueString: priority },
          create: { entityId: id, attributeId: attr.id, valueString: priority }
        });
      }
    }

    // Update target audience attribute
    if (targetAudience !== undefined) {
      let attr = await prisma.attribute.findFirst({ where: { name: 'targetAudience' } });
      if (attr) {
        await prisma.value.upsert({
          where: { entityId_attributeId: { entityId: id, attributeId: attr.id } },
          update: { valueString: targetAudience },
          create: { entityId: id, attributeId: attr.id, valueString: targetAudience }
        });
      }
    }

    // Update course relation
    if (courseId !== undefined) {
      await prisma.entityRelation.deleteMany({
        where: { fromEntityId: id, relationType: 'ANNOUNCEMENT_FOR' }
      });

      if (courseId) {
        const course = await prisma.entity.findFirst({ where: { id: courseId, type: 'COURSE' } });
        if (course) {
          await prisma.entityRelation.create({
            data: {
              fromEntityId: id,
              toEntityId: courseId,
              relationType: 'ANNOUNCEMENT_FOR',
              isActive: true
            }
          });
        }
      }
    }

    res.json({ id: announcement.id, message: "Announcement updated successfully" });
  } catch (error) {
    console.error("Update announcement error:", error);
    res.status(500).json({ error: "Failed to update announcement" });
  }
});

// DELETE announcement
router.delete("/announcements/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Announcement ID is required" });
    }
    await prisma.value.deleteMany({ where: { entityId: id } });
    await prisma.entity.delete({ where: { id } });
    res.json({ message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Delete announcement error:", error);
    res.status(500).json({ error: "Failed to delete announcement" });
  }
});

// ============ EVENTS ============

// GET all events
router.get("/events", authenticateToken, async (req, res) => {
  try {
    const events = await prisma.entity.findMany({
      where: { type: 'EVENT' },
      include: {
        values: { include: { attribute: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = events.map(event => {
      const attrs: Record<string, string | number | boolean | Date | null> = {};
      event.values.forEach(v => {
        attrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
      });
      return {
        id: event.id,
        title: event.name,
        description: event.description,
        isActive: event.isActive,
        createdAt: event.createdAt,
        ...attrs
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error("Get events error:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// CREATE event
router.post("/events", authenticateToken, async (req, res) => {
  try {
    const { title, description, date, time, location, type } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const event = await prisma.entity.create({
      data: {
        type: 'EVENT',
        name: title,
        description: description || '',
      }
    });

    // Create attribute values
    const attributeData = [
      { name: 'eventDate', value: date, dataType: 'STRING' },
      { name: 'eventTime', value: time, dataType: 'STRING' },
      { name: 'eventLocation', value: location, dataType: 'STRING' },
      { name: 'eventType', value: type, dataType: 'STRING' },
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
              entityTypes: JSON.stringify(['EVENT']),
              dataType: attrData.dataType as any,
              category: 'SCHEDULE',
            }
          });
        }
        await prisma.value.create({
          data: { entityId: event.id, attributeId: attr.id, valueString: attrData.value }
        });
      }
    }

    res.status(201).json({
      id: event.id,
      title: event.name,
      message: "Event created successfully"
    });
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({ error: "Failed to create event" });
  }
});

// UPDATE event
router.put("/events/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, time, location, eventType, isActive } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Event ID is required" });
    }

    // Update entity
    const event = await prisma.entity.update({
      where: { id },
      data: {
        name: title !== undefined ? title : undefined,
        description: description !== undefined ? description : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      }
    });

    // Update attribute values
    const attributeUpdates = [
      { name: 'eventDate', value: date },
      { name: 'eventTime', value: time },
      { name: 'eventLocation', value: location },
      { name: 'eventType', value: eventType }
    ];

    for (const update of attributeUpdates) {
      if (update.value !== undefined) {
        const attr = await prisma.attribute.findFirst({ where: { name: update.name } });
        if (attr) {
          await prisma.value.upsert({
            where: { entityId_attributeId: { entityId: id, attributeId: attr.id } },
            update: { valueString: String(update.value) },
            create: { entityId: id, attributeId: attr.id, valueString: String(update.value) }
          });
        }
      }
    }

    res.json({ id: event.id, message: "Event updated successfully" });
  } catch (error) {
    console.error("Update event error:", error);
    res.status(500).json({ error: "Failed to update event" });
  }
});

// DELETE event
router.delete("/events/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Event ID is required" });
    }
    await prisma.value.deleteMany({ where: { entityId: id } });
    await prisma.entity.delete({ where: { id } });
    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({ error: "Failed to delete event" });
  }
});

export const communityRouter = router;
