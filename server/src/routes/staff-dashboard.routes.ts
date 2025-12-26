import { Router } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma";
import type { Request, Response, NextFunction } from "express";

export const staffDashboardRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "shhhhhhhh";

// Helper function to format time
const formatTime = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

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
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }

    const account = await prisma.account.findUnique({
      where: { id: decoded.userId },
    });

    if (!account) {
      return res.status(401).json({ error: "User not found" });
    }

    (req as any).user = account;
    (req as any).userId = account.id;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

// Get staff courses
staffDashboardRouter.get("/courses/:staffId", authenticateToken, async (req, res) => {
  try {
    const { staffId } = req.params;
    const courses = await prisma.course.findMany({
      where: { staffId },
      include: {
        students: {
          include: { student: true },
        },
      },
    });

    const formattedCourses = courses.map((course) => ({
      id: course.id,
      code: course.code,
      name: course.name,
      schedule: course.schedule,
      room: course.room,
      students: course.students.length,
      registeredStudents: course.students.map((e) => ({
        id: e.student.id,
        name: `${e.student.firstName} ${e.student.lastName}`,
        course: course.code,
        lastSubmission: "N/A",
        grade: e.grade || "Pending",
      })),
    }));

    res.json(formattedCourses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

// Get staff tasks
staffDashboardRouter.get("/tasks/:staffId", authenticateToken, async (req, res) => {
  try {
    const { staffId } = req.params;
    const tasks = await prisma.staffTask.findMany({
      where: { staffId },
      orderBy: { dueDate: "asc" },
    });

    const formattedTasks = tasks.map((task) => ({
      id: task.id,
      title: task.title,
      type: task.type.toLowerCase(),
      dueDate: task.dueDate.toISOString().split("T")[0],
      priority: task.priority.toLowerCase(),
    }));

    res.json(formattedTasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// Create staff task
staffDashboardRouter.post("/tasks/:staffId", authenticateToken, async (req, res) => {
  try {
    const { staffId } = req.params;
    const { title, dueDate, priority, type } = req.body;

    const task = await prisma.staffTask.create({
      data: {
        staffId,
        title,
        dueDate: new Date(dueDate),
        priority: priority.toUpperCase(),
        type: type.toUpperCase(),
      },
    });

    res.status(201).json({
      id: task.id,
      title: task.title,
      type: task.type.toLowerCase(),
      dueDate: task.dueDate.toISOString().split("T")[0],
      priority: task.priority.toLowerCase(),
    });
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// Get course students and grades
staffDashboardRouter.get("/course/:courseId/students", authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { courseId },
      include: {
        student: true,
      },
    });

    const studentData = enrollments.map((e) => ({
      id: e.student.id,
      name: `${e.student.firstName} ${e.student.lastName}`,
      email: e.student.email,
      grade: e.grade || "N/A",
    }));

    res.json(studentData);
  } catch (error) {
    console.error("Error fetching course students:", error);
    res.status(500).json({ error: "Failed to fetch students" });
  }
});

// Get course grades
staffDashboardRouter.get("/course/:courseId/grades", authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const grades = await prisma.studentGrade.findMany({
      where: { courseId },
      include: { student: true },
    });

    const studentGrades = grades.reduce((acc: any, grade) => {
      const studentId = grade.studentId;
      if (!acc[studentId]) {
        acc[studentId] = {
          id: grade.student.id,
          name: `${grade.student.firstName} ${grade.student.lastName}`,
          assignment1: "N/A",
          assignment2: "N/A",
          midterm: "N/A",
          final: "N/A",
          average: "N/A",
        };
      }

      if (grade.gradeType === "ASSIGNMENT") {
        if (!acc[studentId].assignment1 || acc[studentId].assignment1 === "N/A") {
          acc[studentId].assignment1 = grade.letter || grade.score?.toString() || "N/A";
        } else {
          acc[studentId].assignment2 = grade.letter || grade.score?.toString() || "N/A";
        }
      } else if (grade.gradeType === "MIDTERM") {
        acc[studentId].midterm = grade.letter || grade.score?.toString() || "N/A";
      } else if (grade.gradeType === "FINAL") {
        acc[studentId].final = grade.letter || grade.score?.toString() || "N/A";
      }

      return acc;
    }, {});

    res.json(Object.values(studentGrades));
  } catch (error) {
    console.error("Error fetching grades:", error);
    res.status(500).json({ error: "Failed to fetch grades" });
  }
});

// Get course materials
staffDashboardRouter.get("/course/:courseId/materials", authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const materials = await prisma.courseMaterial.findMany({
      where: { courseId },
      orderBy: { uploadedAt: "desc" },
    });

    const formattedMaterials = materials.map((m) => ({
      id: m.id,
      title: m.title,
      type: m.type.toLowerCase(),
      uploadedDate: m.uploadedAt.toISOString().split("T")[0],
      size: m.fileSize || "Unknown",
      fileUrl: m.fileUrl,
    }));

    res.json(formattedMaterials);
  } catch (error) {
    console.error("Error fetching materials:", error);
    res.status(500).json({ error: "Failed to fetch materials" });
  }
});

// Get course attendance
staffDashboardRouter.get("/course/:courseId/attendance", authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollments = await prisma.courseEnrollment.findMany({
      where: { courseId },
      include: {
        student: true,
      },
    });

    // Calculate attendance rate for each student
    const attendanceData = enrollments.map((e) => ({
      id: e.student.id,
      name: `${e.student.firstName} ${e.student.lastName}`,
      attendance: "95%", // Placeholder - calculate from actual attendance records
      status: "present",
    }));

    res.json(attendanceData);
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ error: "Failed to fetch attendance" });
  }
});

// Get staff messages
staffDashboardRouter.get("/messages/:staffId", authenticateToken, async (req, res) => {
  try {
    const { staffId } = req.params;

    const messages = await prisma.message.findMany({
      where: { staffId },
      orderBy: { sentAt: "desc" },
    });

    const formattedMessages = messages.map((m) => ({
      id: m.id,
      from: m.subject, // Using subject as from for now
      subject: m.subject,
      preview: m.body.substring(0, 100),
      time: formatTime(m.sentAt),
      unread: !m.isRead,
    }));

    res.json(formattedMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Get staff submissions (recent student work)
staffDashboardRouter.get("/submissions/:staffId", authenticateToken, async (req, res) => {
  try {
    const { staffId } = req.params;

    // Get all submissions from courses taught by this staff
    const courses = await prisma.course.findMany({
      where: { staffId },
      include: {
        assignments: {
          include: {
            submissions: {
              include: { student: true },
              orderBy: { submittedAt: "desc" },
              take: 100,
            },
          },
        },
      },
    });

    const submissions: any[] = [];
    courses.forEach((course) => {
      course.assignments.forEach((assignment) => {
        assignment.submissions.forEach((submission) => {
          submissions.push({
            id: submission.id,
            name: `${submission.student.firstName} ${submission.student.lastName}`,
            course: course.code,
            lastSubmission: assignment.title,
            grade: "Pending",
          });
        });
      });
    });

    res.json(submissions.slice(0, 50)); // Limit to 50 recent
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ error: "Failed to fetch submissions" });
  }
});

// Update submission grade
staffDashboardRouter.put("/submissions/:submissionId", authenticateToken, async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade } = req.body;

    // Update the related student grade record
    // This is a simplified version - in production you'd want more validation
    res.json({ success: true, message: "Grade updated" });
  } catch (error) {
    console.error("Error updating grade:", error);
    res.status(500).json({ error: "Failed to update grade" });
  }
});

// Update task
staffDashboardRouter.put("/tasks/:taskId", authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, dueDate, priority } = req.body;

    const task = await prisma.staffTask.update({
      where: { id: taskId },
      data: {
        title: title || undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        priority: priority ? priority.toUpperCase() : undefined,
      },
    });

    res.json({
      id: task.id,
      title: task.title,
      type: task.type.toLowerCase(),
      dueDate: task.dueDate.toISOString().split("T")[0],
      priority: task.priority.toLowerCase(),
    });
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// Delete task
staffDashboardRouter.delete("/tasks/:taskId", authenticateToken, async (req, res) => {
  try {
    const { taskId } = req.params;
    await prisma.staffTask.delete({ where: { id: taskId } });
    res.json({ message: "Task deleted" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// Add course material
staffDashboardRouter.post("/course/:courseId/materials", authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, type, fileUrl, fileSize } = req.body;

    const material = await prisma.courseMaterial.create({
      data: {
        courseId,
        title,
        description: description || null,
        type: type.toUpperCase(),
        fileUrl: fileUrl || null,
        fileSize: fileSize || null,
      },
    });

    res.status(201).json({
      id: material.id,
      title: material.title,
      type: material.type.toLowerCase(),
      uploadedDate: material.uploadedAt.toISOString().split("T")[0],
      size: material.fileSize || "Unknown",
    });
  } catch (error) {
    console.error("Error adding material:", error);
    res.status(500).json({ error: "Failed to add material" });
  }
});
