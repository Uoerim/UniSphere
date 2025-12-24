import express from "express";
import { prisma } from "./prisma";
import { staffRouter } from "./routes/staff.routes";
import { staffCoursesRouter } from "./routes/staff-courses.routes";
import { authRouter } from "./routes/auth.routes";
import { usersRouter } from "./routes/users.routes";
import { dashboardRouter } from "./routes/dashboard.routes";
import { facilitiesRouter } from "./routes/facilities.routes";
import { curriculumRouter } from "./routes/curriculum.routes";
import { communityRouter } from "./routes/community.routes";
import { studentRouter } from "./routes/student.routes";
import { departmentRouter } from "./routes/department.routes";
import { parentRouter } from "./routes/parent.routes";
import { assessmentRouter } from "./routes/assessment.routes";
import { assignmentRouter } from "./routes/assignment.routes";
import { adminRouter } from "./routes/admin.routes";
import cors from "cors";



const app = express();
app.use(express.json());
app.use(cors());


////

app.use("/api/staff", staffRouter);
app.use("/api/staff-courses", staffCoursesRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/facilities", facilitiesRouter);
app.use("/api/curriculum", curriculumRouter);
app.use("/api/community", communityRouter);
app.use("/api/students", studentRouter);
app.use("/api/departments", departmentRouter);
app.use("/api/parents", parentRouter);
app.use("/api/assessments", assessmentRouter);
app.use("/api/assignments", assignmentRouter);
app.use("/api/admin", adminRouter);

////

app.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true, db: "connected" });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
