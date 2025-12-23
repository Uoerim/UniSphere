import { Router } from "express";
import { prisma } from "../prisma";

export const staffRouter = Router();

/**
 * POST /api/staff
 * body: { attributes: { name: "Dr", email: "...", office_hours: "...", salary_grade: 2 } }
 */
staffRouter.post("/", async (req, res) => {
  const attributes = req.body?.attributes ?? {};

  const entity = await prisma.entity.create({
    data: { type: "staff" },
  });

  for (const [name, raw] of Object.entries(attributes)) {
    const dataType = typeof raw;

    const attr = await prisma.attribute.upsert({
      where: { name },
      update: {},
      create: { name, dataType },
    });

    await prisma.value.upsert({
      where: {
        entityId_attributeId: { entityId: entity.id, attributeId: attr.id },
      },
      update: toValueUpdate(raw),
      create: {
        entityId: entity.id,
        attributeId: attr.id,
        ...toValueCreate(raw),
      },
    });
  }

  res.status(201).json({ id: entity.id });
});

/** GET /api/staff */
staffRouter.get("/", async (_req, res) => {
  const staff = await prisma.entity.findMany({
    where: { type: "staff" },
    include: { values: { include: { attribute: true } } },
  });

  const normalized = staff.map((s) => ({
    id: s.id,
    ...Object.fromEntries(
      s.values.map((v) => [
        v.attribute.name,
        v.valueString ?? v.valueNumber ?? v.valueBool ?? v.valueDate,
      ])
    ),
  }));

  res.json(normalized);
});


// GET /api/staff/:id
staffRouter.get("/:id", async (req, res) => {
  const { id } = req.params;

  const staff = await prisma.entity.findFirst({
    where: { id, type: "staff" },
    include: { values: { include: { attribute: true } } },
  });

  if (!staff) return res.status(404).json({ message: "Not found" });

  const normalized = {
    id: staff.id,
    ...Object.fromEntries(
      staff.values.map((v) => [
        v.attribute.name,
        v.valueString ?? v.valueNumber ?? v.valueBool ?? v.valueDate,
      ])
    ),
  };

  res.json(normalized);
});

// PATCH /api/staff/:id  (update/overwrite attributes)
staffRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const attributes = req.body?.attributes ?? {};

  const exists = await prisma.entity.findFirst({ where: { id, type: "staff" } });
  if (!exists) return res.status(404).json({ message: "Not found" });

  for (const [name, raw] of Object.entries(attributes)) {
    const attr = await prisma.attribute.upsert({
      where: { name },
      update: {},
      create: { name, dataType: typeof raw },
    });

    await prisma.value.upsert({
      where: { entityId_attributeId: { entityId: id, attributeId: attr.id } },
      update: toValueUpdate(raw),
      create: { entityId: id, attributeId: attr.id, ...toValueCreate(raw) },
    });
  }

  res.json({ ok: true });
});

// DELETE /api/staff/:id
staffRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  // delete values then entity (safe + clear)
  await prisma.value.deleteMany({ where: { entityId: id } });
  await prisma.entity.delete({ where: { id } });

  res.json({ ok: true });
});


function toValueCreate(v: any) {
  if (typeof v === "string") return { valueString: v };
  if (typeof v === "number") return { valueNumber: v };
  if (typeof v === "boolean") return { valueBool: v };
  return { valueString: String(v) };
}

function toValueUpdate(v: any) {
  return { valueString: null, valueNumber: null, valueBool: null, valueDate: null, ...toValueCreate(v) };
}
