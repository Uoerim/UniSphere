import express from "express";
import { prisma } from "./prisma";
import { staffRouter } from "./routes/staff.routes";
import { authRouter } from "./routes/auth.routes";
import { usersRouter } from "./routes/users.routes";
import { dashboardRouter } from "./routes/dashboard.routes";
import { facilitiesRouter } from "./routes/facilities.routes";
import { curriculumRouter } from "./routes/curriculum.routes";
import { communityRouter } from "./routes/community.routes";
import cors from "cors";



const app = express();
app.use(express.json());
app.use(cors());


////

app.use("/api/staff", staffRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", usersRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/facilities", facilitiesRouter);
app.use("/api/curriculum", curriculumRouter);
app.use("/api/community", communityRouter);

////

app.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true, db: "connected" });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
