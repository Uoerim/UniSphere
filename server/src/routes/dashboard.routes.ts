import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "shhhhhhhh";

// Middleware to verify JWT token
const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.substring(7);

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const account = await prisma.account.findUnique({
      where: { id: decoded.userId }
    });

    if (!account) {
      return res.status(401).json({ error: "User not found" });
    }

    (req as any).user = account;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

// GET dashboard stats
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    // Get counts from database
    const [totalStudents, totalStaff, totalCourses, totalEvents] = await Promise.all([
      prisma.account.count({ where: { role: 'STUDENT' } }),
      prisma.account.count({ where: { role: { in: ['STAFF', 'ADMIN'] } } }),
      prisma.entity.count({ where: { type: 'COURSE' } }),
      prisma.entity.count({ where: { type: 'EVENT' } }),
    ]);

    res.json({
      totalStudents,
      totalStaff,
      totalCourses,
      totalEvents,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ error: "Failed to fetch dashboard stats" });
  }
});

// GET recent activity
router.get("/activity", authenticateToken, async (req, res) => {
  try {
    const recentEntities = await prisma.entity.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        name: true,
        createdAt: true,
      }
    });

    res.json(recentEntities);
  } catch (error) {
    console.error("Activity error:", error);
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

export const dashboardRouter = router;
