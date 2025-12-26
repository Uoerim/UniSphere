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

// Get all conversations for current user
router.get("/conversations", authenticateToken, async (req: Request, res: Response) => {
    try {
        const accountId = (req as any).user.userId;

        const conversations = await prisma.conversation.findMany({
            where: {
                participants: {
                    some: {
                        accountId: accountId
                    }
                }
            },
            include: {
                participants: true,
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1
                }
            },
            orderBy: { updatedAt: "desc" }
        });

        // Get participant details (accounts) for each conversation
        const conversationsWithDetails = await Promise.all(
            conversations.map(async (conv) => {
                const participantAccounts = await prisma.account.findMany({
                    where: {
                        id: {
                            in: conv.participants.map(p => p.accountId)
                        }
                    },
                    select: {
                        id: true,
                        email: true,
                        role: true,
                        entity: {
                            select: {
                                name: true
                            }
                        }
                    }
                });

                const lastMessage = conv.messages[0] || null;
                const myParticipant = conv.participants.find(p => p.accountId === accountId);
                const unreadCount = lastMessage && myParticipant?.lastReadAt
                    ? (lastMessage.createdAt > myParticipant.lastReadAt ? 1 : 0)
                    : (lastMessage ? 1 : 0);

                return {
                    id: conv.id,
                    participants: participantAccounts.map(a => ({
                        id: a.id,
                        email: a.email,
                        name: a.entity?.name || a.email.split("@")[0],
                        role: a.role
                    })),
                    lastMessage: lastMessage ? {
                        id: lastMessage.id,
                        content: lastMessage.content,
                        senderId: lastMessage.senderId,
                        createdAt: lastMessage.createdAt
                    } : null,
                    unreadCount,
                    updatedAt: conv.updatedAt
                };
            })
        );

        res.json(conversationsWithDetails);
    } catch (error: any) {
        console.error("Error fetching conversations:", error);
        res.status(500).json({ error: "Failed to fetch conversations" });
    }
});

// Get messages for a conversation
router.get("/conversations/:id/messages", authenticateToken, async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const accountId = (req as any).user.userId;

        // Verify user is participant
        const participant = await prisma.conversationParticipant.findFirst({
            where: { conversationId: id, accountId }
        });

        if (!participant) {
            return res.status(403).json({ error: "Not a participant" });
        }

        const messages = await prisma.chatMessage.findMany({
            where: { conversationId: id },
            orderBy: { createdAt: "asc" }
        });

        // Get sender details
        const senderIds = [...new Set(messages.map(m => m.senderId))];
        const senders = await prisma.account.findMany({
            where: { id: { in: senderIds } },
            select: {
                id: true,
                email: true,
                entity: { select: { name: true } }
            }
        });

        const senderMap = new Map(senders.map(s => [s.id, {
            id: s.id,
            email: s.email,
            name: s.entity?.name || s.email.split("@")[0]
        }]));

        const messagesWithSender = messages.map(m => ({
            id: m.id,
            content: m.content,
            createdAt: m.createdAt,
            sender: senderMap.get(m.senderId)
        }));

        // Update lastReadAt
        await prisma.conversationParticipant.update({
            where: { id: participant.id },
            data: { lastReadAt: new Date() }
        });

        res.json(messagesWithSender);
    } catch (error: any) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
});

// Create a new conversation or get existing one
router.post("/conversations", authenticateToken, async (req: Request, res: Response) => {
    try {
        const accountId = (req as any).user.userId;
        const { recipientId } = req.body;

        if (!recipientId) {
            return res.status(400).json({ error: "recipientId is required" });
        }

        // Check if conversation already exists between these two users
        const existingConversation = await prisma.conversation.findFirst({
            where: {
                AND: [
                    { participants: { some: { accountId } } },
                    { participants: { some: { accountId: recipientId } } }
                ]
            },
            include: {
                participants: true
            }
        });

        if (existingConversation && existingConversation.participants.length === 2) {
            return res.json({ id: existingConversation.id, isNew: false });
        }

        // Create new conversation
        const conversation = await prisma.conversation.create({
            data: {
                participants: {
                    create: [
                        { accountId },
                        { accountId: recipientId }
                    ]
                }
            }
        });

        res.json({ id: conversation.id, isNew: true });
    } catch (error: any) {
        console.error("Error creating conversation:", error);
        res.status(500).json({ error: "Failed to create conversation" });
    }
});

// Send a message
router.post("/conversations/:id/messages", authenticateToken, async (req: Request, res: Response) => {
    try {
        const { id: conversationId } = req.params;
        const accountId = (req as any).user.userId;
        const { content } = req.body;

        if (!content?.trim()) {
            return res.status(400).json({ error: "Message content is required" });
        }

        // Verify user is participant
        const participant = await prisma.conversationParticipant.findFirst({
            where: { conversationId, accountId }
        });

        if (!participant) {
            return res.status(403).json({ error: "Not a participant" });
        }

        // Create message
        const message = await prisma.chatMessage.create({
            data: {
                conversationId,
                senderId: accountId,
                content: content.trim()
            }
        });

        // Update conversation updatedAt
        await prisma.conversation.update({
            where: { id: conversationId },
            data: { updatedAt: new Date() }
        });

        // Get sender info
        const sender = await prisma.account.findUnique({
            where: { id: accountId },
            select: {
                id: true,
                email: true,
                entity: { select: { name: true } }
            }
        });

        const messageWithSender = {
            id: message.id,
            content: message.content,
            createdAt: message.createdAt,
            sender: {
                id: sender?.id,
                email: sender?.email,
                name: sender?.entity?.name || sender?.email?.split("@")[0]
            }
        };

        // Emit to all participants via Socket.IO
        const io = req.app.get("io");
        if (io) {
            io.to(conversationId).emit("new-message", {
                conversationId,
                message: messageWithSender
            });

            // Notify other participants
            const participants = await prisma.conversationParticipant.findMany({
                where: { conversationId, accountId: { not: accountId } }
            });

            for (const p of participants) {
                // Create notification
                await prisma.notification.create({
                    data: {
                        accountId: p.accountId,
                        type: "message",
                        title: "New Message",
                        body: `${sender?.entity?.name || sender?.email}: ${content.substring(0, 50)}...`,
                        link: `/messages?conversation=${conversationId}`
                    }
                });

                io.to(p.accountId).emit("notification", {
                    type: "message",
                    conversationId,
                    preview: content.substring(0, 50)
                });
            }
        }

        res.json(messageWithSender);
    } catch (error: any) {
        console.error("Error sending message:", error);
        res.status(500).json({ error: "Failed to send message" });
    }
});

// Get all users to chat with
router.get("/users", authenticateToken, async (req: Request, res: Response) => {
    try {
        const accountId = (req as any).user.userId;

        const users = await prisma.account.findMany({
            where: {
                id: { not: accountId },
                isActive: true
            },
            select: {
                id: true,
                email: true,
                role: true,
                entity: {
                    select: { name: true }
                }
            },
            orderBy: { email: "asc" }
        });

        res.json(users.map(u => ({
            id: u.id,
            email: u.email,
            name: u.entity?.name || u.email.split("@")[0],
            role: u.role
        })));
    } catch (error: any) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

export const chatRouter = router;
