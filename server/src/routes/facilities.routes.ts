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

// In-memory facilities storage (would normally be in database)
let facilities: any[] = [
    { id: 1, name: 'Physics Lab 101', roomNumber: 'A-101', type: 'LABORATORY', floor: 1, capacity: 30, status: 'AVAILABLE', features: ['Projector', 'Whiteboard', 'Lab Equipment'], notes: '' },
    { id: 2, name: 'Lecture Hall A', roomNumber: 'LH-A', type: 'LECTURE_HALL', floor: 2, capacity: 200, status: 'AVAILABLE', features: ['Projector', 'Microphone', 'AC'], notes: '' },
    { id: 3, name: 'Computer Lab 1', roomNumber: 'C-101', type: 'COMPUTER_LAB', floor: 1, capacity: 40, status: 'OCCUPIED', features: ['40 Computers', 'Projector', 'AC'], notes: '' },
    { id: 4, name: 'Admin Office', roomNumber: 'O-001', type: 'OFFICE', floor: 0, capacity: 5, status: 'AVAILABLE', features: ['Desks', 'AC'], notes: '' },
    { id: 5, name: 'Conference Room A', roomNumber: 'CR-A', type: 'CONFERENCE_ROOM', floor: 1, capacity: 20, status: 'RESERVED', features: ['Projector', 'Whiteboard', 'Video Conferencing'], notes: '' },
    { id: 6, name: 'Classroom 101', roomNumber: 'CR-101', type: 'CLASSROOM', floor: 1, capacity: 35, status: 'AVAILABLE', features: ['Whiteboard', 'Projector'], notes: '' },
    { id: 7, name: 'Classroom 102', roomNumber: 'CR-102', type: 'CLASSROOM', floor: 1, capacity: 35, status: 'AVAILABLE', features: ['Whiteboard', 'Projector'], notes: '' },
    { id: 8, name: 'Tutorial Room 1', roomNumber: 'TR-1', type: 'TUTORIAL_ROOM', floor: 2, capacity: 15, status: 'AVAILABLE', features: ['Whiteboard'], notes: '' },
];
let facilityIdCounter = 9;

// GET all facilities
router.get("/", authenticateToken, async (_req, res) => {
    try {
        res.json(facilities);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch facilities" });
    }
});

// GET single facility
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const facility = facilities.find(f => f.id === id);
        if (!facility) {
            return res.status(404).json({ error: "Facility not found" });
        }
        res.json(facility);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch facility" });
    }
});

// CREATE facility
router.post("/", authenticateToken, async (req, res) => {
    try {
        const { name, roomNumber, type, floor, capacity, status, features, notes } = req.body;
        const facility = {
            id: facilityIdCounter++,
            name,
            roomNumber,
            type: type || 'CLASSROOM',
            floor: floor || 1,
            capacity: capacity || 0,
            status: status || 'AVAILABLE',
            features: features || [],
            notes: notes || ''
        };
        facilities.push(facility);
        res.status(201).json(facility);
    } catch (error) {
        res.status(500).json({ error: "Failed to create facility" });
    }
});

// UPDATE facility
router.put("/:id", authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const index = facilities.findIndex(f => f.id === id);
        if (index === -1) {
            return res.status(404).json({ error: "Facility not found" });
        }
        const { name, roomNumber, type, floor, capacity, status, features, notes } = req.body;
        facilities[index] = {
            ...facilities[index],
            name: name ?? facilities[index].name,
            roomNumber: roomNumber ?? facilities[index].roomNumber,
            type: type ?? facilities[index].type,
            floor: floor ?? facilities[index].floor,
            capacity: capacity ?? facilities[index].capacity,
            status: status ?? facilities[index].status,
            features: features ?? facilities[index].features,
            notes: notes ?? facilities[index].notes
        };
        res.json(facilities[index]);
    } catch (error) {
        res.status(500).json({ error: "Failed to update facility" });
    }
});

// DELETE facility
router.delete("/:id", authenticateToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const index = facilities.findIndex(f => f.id === id);
        if (index === -1) {
            return res.status(404).json({ error: "Facility not found" });
        }
        facilities.splice(index, 1);
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete facility" });
    }
});

export const facilitiesRouter = router;
