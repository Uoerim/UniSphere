import { Router, Request, Response } from "express";
import { prisma } from "../prisma";
import jwt from "jsonwebtoken";

const router = Router();

// Auth middleware
const authenticateToken = (req: Request, res: Response, next: any) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
        return res.status(401).json({ error: "Access token required" });
    }

    jwt.verify(token, process.env.JWT_SECRET || "dev-secret", (err: any, user: any) => {
        if (err) {
            return res.status(403).json({ error: "Invalid token" });
        }
        (req as any).user = user;
        next();
    });
};

// Get all notifications for current user
router.get("/", authenticateToken, async (req: Request, res: Response) => {
    try {
        const accountId = (req as any).user.userId;
        const { unreadOnly } = req.query;

        const notifications = await prisma.notification.findMany({
            where: {
                accountId,
                ...(unreadOnly === "true" ? { isRead: false } : {})
            },
            orderBy: { createdAt: "desc" },
            take: 50
        });

        res.json(notifications);
    } catch (error: any) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ error: "Failed to fetch notifications" });
    }
});

// Get unread count
router.get("/unread-count", authenticateToken, async (req: Request, res: Response) => {
    try {
        const accountId = (req as any).user.userId;

        const count = await prisma.notification.count({
            where: { accountId, isRead: false }
        });

        res.json({ count });
    } catch (error: any) {
        console.error("Error fetching unread count:", error);
        res.status(500).json({ error: "Failed to fetch unread count" });
    }
});

// Mark notification as read
router.put("/:id/read", authenticateToken, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const accountId = (req as any).user.userId;

        const notification = await prisma.notification.updateMany({
            where: { id, accountId },
            data: { isRead: true }
        });

        if (notification.count === 0) {
            return res.status(404).json({ error: "Notification not found" });
        }

        res.json({ success: true });
    } catch (error: any) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ error: "Failed to mark notification as read" });
    }
});

// Mark all notifications as read
router.put("/read-all", authenticateToken, async (req: Request, res: Response) => {
    try {
        const accountId = (req as any).user.userId;

        await prisma.notification.updateMany({
            where: { accountId, isRead: false },
            data: { isRead: true }
        });

        res.json({ success: true });
    } catch (error: any) {
        console.error("Error marking all as read:", error);
        res.status(500).json({ error: "Failed to mark all as read" });
    }
});

// Delete notification
router.delete("/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const accountId = (req as any).user.userId;

        await prisma.notification.deleteMany({
            where: { id, accountId }
        });

        res.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ error: "Failed to delete notification" });
    }
});

// Create notification (internal use, can also be called from other routes)
router.post("/", authenticateToken, async (req: Request, res: Response) => {
    try {
        const { accountId, type, title, body, link } = req.body;

        if (!accountId || !type || !title || !body) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const notification = await prisma.notification.create({
            data: { accountId, type, title, body, link }
        });

        // Emit to user via Socket.IO
        const io = req.app.get("io");
        if (io) {
            io.to(accountId).emit("notification", notification);
        }

        res.json(notification);
    } catch (error: any) {
        console.error("Error creating notification:", error);
        res.status(500).json({ error: "Failed to create notification" });
    }
});

export const notificationRouter = router;
