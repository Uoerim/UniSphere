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

// GET all classrooms/rooms
router.get("/rooms", authenticateToken, async (req, res) => {
  try {
    const rooms = await prisma.entity.findMany({
      where: { type: 'ROOM' },
      include: {
        values: {
          include: { attribute: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    const formattedRooms = rooms.map(room => {
      const attrs: Record<string, string | number | boolean | Date | null> = {};
      room.values.forEach(v => {
        attrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
      });
      return {
        id: room.id,
        name: room.name,
        description: room.description,
        isActive: room.isActive,
        createdAt: room.createdAt,
        ...attrs
      };
    });

    res.json(formattedRooms);
  } catch (error) {
    console.error("Get rooms error:", error);
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

// CREATE room
router.post("/rooms", authenticateToken, async (req, res) => {
  try {
    const { name, description, capacity, building, floor, type } = req.body;

    // Create entity for room
    const room = await prisma.entity.create({
      data: {
        type: 'ROOM',
        name,
        description,
      }
    });

    // Get or create attributes
    const attributeConfigs = [
      { name: 'capacity', dataType: 'NUMBER' as const },
      { name: 'building', dataType: 'STRING' as const },
      { name: 'floor', dataType: 'STRING' as const },
      { name: 'roomType', dataType: 'STRING' as const },
    ];
    const attributes = await Promise.all(
      attributeConfigs.map(async (config) => {
        let attr = await prisma.attribute.findFirst({ where: { name: config.name } });
        if (!attr) {
          attr = await prisma.attribute.create({
            data: {
              name: config.name,
              displayName: config.name.charAt(0).toUpperCase() + config.name.slice(1),
              entityTypes: JSON.stringify(['ROOM']),
              dataType: config.dataType,
              category: 'FACILITY',
            }
          });
        }
        return attr;
      })
    );

    // Create values with null checks
    const valuesToCreate = [];
    if (attributes[0]) valuesToCreate.push({ attributeId: attributes[0].id, entityId: room.id, valueNumber: parseInt(capacity) || 30 });
    if (attributes[1]) valuesToCreate.push({ attributeId: attributes[1].id, entityId: room.id, valueString: building || 'Main' });
    if (attributes[2]) valuesToCreate.push({ attributeId: attributes[2].id, entityId: room.id, valueString: floor || '1' });
    if (attributes[3]) valuesToCreate.push({ attributeId: attributes[3].id, entityId: room.id, valueString: type || 'Classroom' });

    if (valuesToCreate.length > 0) {
      await prisma.value.createMany({ data: valuesToCreate });
    }

    res.status(201).json({ id: room.id, name: room.name, message: "Room created successfully" });
  } catch (error) {
    console.error("Create room error:", error);
    res.status(500).json({ error: "Failed to create room" });
  }
});

// UPDATE room
router.put("/rooms/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Room ID is required" });
    }

    const room = await prisma.entity.update({
      where: { id },
      data: { name, description, isActive }
    });

    res.json(room);
  } catch (error) {
    console.error("Update room error:", error);
    res.status(500).json({ error: "Failed to update room" });
  }
});

// DELETE room
router.delete("/rooms/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Room ID is required" });
    }

    // Delete values first
    await prisma.value.deleteMany({ where: { entityId: id } });
    // Delete entity
    await prisma.entity.delete({ where: { id } });

    res.json({ message: "Room deleted successfully" });
  } catch (error) {
    console.error("Delete room error:", error);
    res.status(500).json({ error: "Failed to delete room" });
  }
});

// GET all resources
router.get("/resources", authenticateToken, async (req, res) => {
  try {
    // For now, return mock data - in production this would use EAV pattern
    const resources = [
      { id: '1', name: 'Projector A', type: 'Equipment', status: 'Available', location: 'Room 101' },
      { id: '2', name: 'Laptop Cart B', type: 'Equipment', status: 'In Use', location: 'Lab 202' },
      { id: '3', name: 'Software License - MATLAB', type: 'Software', status: 'Available', location: 'N/A' },
    ];
    res.json(resources);
  } catch (error) {
    console.error("Get resources error:", error);
    res.status(500).json({ error: "Failed to fetch resources" });
  }
});

export const facilitiesRouter = router;
