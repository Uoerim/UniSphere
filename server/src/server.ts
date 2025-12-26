import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { prisma } from "./prisma";
import { staffRouter } from "./routes/staff.routes";
import { staffCoursesRouter } from "./routes/staff-courses.routes";
import { staffDashboardRouter } from "./routes/staff-dashboard.routes";
import { authRouter } from "./routes/auth.routes";
import { usersRouter } from "./routes/users.routes";
import { dashboardRouter } from "./routes/dashboard.routes";
import { facilitiesRouter } from "./routes/facilities.routes";
import roomsRouter from "./routes/rooms.routes";
import { curriculumRouter } from "./routes/curriculum.routes";
import { communityRouter } from "./routes/community.routes";
import { studentRouter } from "./routes/student.routes";
import { parentRouter } from "./routes/parent.routes";
import { assessmentRouter } from "./routes/assessment.routes";
import { assignmentRouter } from "./routes/assignment.routes";
import { adminRouter } from "./routes/admin.routes";
import { chatRouter } from "./routes/chat.routes";
import { notificationRouter } from "./routes/notification.routes";
import cors from "cors";

const app = express();
const httpServer = createServer(app);

// Socket.IO setup with CORS
export const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Track online users: Map<accountId, socketId>
const onlineUsers = new Map<string, string>();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // User joins their personal room
  socket.on("join", (accountId: string) => {
    socket.join(accountId);
    onlineUsers.set(accountId, socket.id);
    // Broadcast online status to all
    io.emit("user-online", accountId);
    // Send current online users to the new user
    socket.emit("online-users", Array.from(onlineUsers.keys()));
    console.log(`User ${accountId} is online`);
  });

  // Typing indicator
  socket.on("typing", ({ conversationId, senderId }) => {
    socket.to(conversationId).emit("user-typing", { conversationId, senderId });
  });

  socket.on("stop-typing", ({ conversationId, senderId }) => {
    socket.to(conversationId).emit("user-stop-typing", { conversationId, senderId });
  });

  // Join conversation room
  socket.on("join-conversation", (conversationId: string) => {
    socket.join(conversationId);
  });

  // Leave conversation room
  socket.on("leave-conversation", (conversationId: string) => {
    socket.leave(conversationId);
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    // Find and remove the user from onlineUsers
    for (const [accountId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(accountId);
        io.emit("user-offline", accountId);
        console.log(`User ${accountId} is offline`);
        break;
      }
    }
  });
});

app.use(express.json());
app.use(cors());

// Make io available to routes
app.set("io", io);

////

app.use("/api/staff", staffRouter);
app.use("/api/staff-courses", staffCoursesRouter);
app.use("/api/staff-dashboard", staffDashboardRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/facilities", roomsRouter);
app.use("/api/facilities", facilitiesRouter);
app.use("/api/curriculum", curriculumRouter);
app.use("/api/community", communityRouter);
app.use("/api/students", studentRouter);
app.use("/api/parents", parentRouter);
app.use("/api/assessments", assessmentRouter);
app.use("/api/assignments", assignmentRouter);
app.use("/api/admin", adminRouter);
app.use("/api/chat", chatRouter);
app.use("/api/notifications", notificationRouter);

////

app.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true, db: "connected" });
});

const PORT = 4000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Socket.IO ready for connections`);
});
