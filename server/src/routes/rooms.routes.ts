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

// GET all buildings
router.get("/buildings", authenticateToken, async (req, res) => {
  try {
    const buildings = await prisma.entity.findMany({
      where: { type: 'BUILDING' },
      include: { values: { include: { attribute: true } } },
      orderBy: { name: 'asc' }
    });
    const formatted = buildings.map(b => {
      const attrs: Record<string, any> = {};
      b.values.forEach(v => {
        attrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
      });
      return { id: b.id, name: b.name, description: b.description, ...attrs };
    });
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch buildings" });
  }
});

// CREATE building
router.post("/buildings", authenticateToken, async (req, res) => {
  try {
    const { name, description, code } = req.body;
    const building = await prisma.entity.create({
      data: { type: 'BUILDING', name, description, code }
    });
    res.json(building);
  } catch (error) {
    res.status(500).json({ error: "Failed to create building" });
  }
});

// GET all rooms
router.get("/rooms", authenticateToken, async (req, res) => {
  try {
    const rooms = await prisma.entity.findMany({
      where: { type: 'ROOM' },
      include: { values: { include: { attribute: true } }, parent: true },
      orderBy: { name: 'asc' }
    });
    const formatted = rooms.map(r => {
      const attrs: Record<string, any> = {};
      r.values.forEach(v => {
        attrs[v.attribute.name] = v.valueString || v.valueNumber || v.valueBool || v.valueDate;
      });
      return { id: r.id, name: r.name, description: r.description, building: r.parent?.name, ...attrs };
    });
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch rooms" });
  }
});

// CREATE room
router.post("/rooms", authenticateToken, async (req, res) => {
  try {
    const { name, description, code, buildingId, capacity, floor, roomType } = req.body;
    const room = await prisma.entity.create({
      data: {
        type: 'ROOM',
        name,
        description,
        code,
        parentId: buildingId
      }
    });
    // Add EAV attributes
    const attrConfigs = [
      { name: 'capacity', value: capacity, dataType: 'NUMBER' },
      { name: 'floor', value: floor, dataType: 'STRING' },
      { name: 'roomType', value: roomType, dataType: 'STRING' },
    ];
    for (const config of attrConfigs) {
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
      await prisma.value.create({
        data: {
          entityId: room.id,
          attributeId: attr.id,
          valueString: typeof config.value === 'string' ? config.value : undefined,
          valueNumber: typeof config.value === 'number' ? config.value : undefined
        }
      });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: "Failed to create room" });
  }
});

export default router;
