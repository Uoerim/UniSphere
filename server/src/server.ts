import express from "express";
import { prisma } from "./prisma";
import { staffRouter } from "./routes/staff.routes";


const app = express();
app.use(express.json());

////

app.use("/api/staff", staffRouter);

////

app.get("/health", async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true, db: "connected" });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
