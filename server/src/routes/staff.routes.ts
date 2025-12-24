import { Router } from "express";
import { prisma } from "../prisma";
import type { AttributeDataType } from "@prisma/client";

export const staffRouter = Router();

// Helper function to map JS types to Prisma AttributeDataType enum
function getAttributeDataType(value: any): AttributeDataType {
  if (typeof value === "string") return "STRING";
  if (typeof value === "number") return "NUMBER";
  if (typeof value === "boolean") return "BOOLEAN";
  if (value instanceof Date) return "DATE";
  return "STRING";
}

/**
 * POST /api/staff
 * body: { attributes: { name: "Dr", email: "...", office_hours: "...", salary_grade: 2 } }
 */
staffRouter.post("/", async (req, res) => {
  const attributes = req.body?.attributes ?? {};

  const entity = await prisma.entity.create({
    data: { type: "STAFF" },
  });

  for (const [name, raw] of Object.entries(attributes)) {
    const dataType = getAttributeDataType(raw);

    const attr = await prisma.attribute.upsert({
      where: { name },
      update: {},
      create: { 
        name, 
        displayName: name,
        dataType,
        category: "PERSONAL",
        entityTypes: JSON.stringify(["STAFF"])
      },
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
    where: { type: "STAFF" },
    include: { values: { include: { attribute: true } } },
  });

  const normalized = staff.map((s) => ({
    id: s.id,
    ...Object.fromEntries(
      s.values.map((v) => [
        v.attribute.name,
        v.valueString ?? v.valueNumber ?? v.valueBool ?? v.valueDate ?? v.valueDateTime ?? v.valueText,
      ])
    ),
  }));

  res.json(normalized);
});


// GET /api/staff/:id
staffRouter.get("/:id", async (req, res) => {
  const { id } = req.params;

  const staff = await prisma.entity.findFirst({
    where: { id, type: "STAFF" },
    include: { values: { include: { attribute: true } } },
  });

  if (!staff) return res.status(404).json({ message: "Not found" });

  const normalized = {
    id: staff.id,
    ...Object.fromEntries(
      staff.values.map((v) => [
        v.attribute.name,
        v.valueString ?? v.valueNumber ?? v.valueBool ?? v.valueDate ?? v.valueDateTime ?? v.valueText,
      ])
    ),
  };

  res.json(normalized);
});

// PATCH /api/staff/:id  (update/overwrite attributes)
staffRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const attributes = req.body?.attributes ?? {};

  const exists = await prisma.entity.findFirst({ where: { id, type: "STAFF" } });
  if (!exists) return res.status(404).json({ message: "Not found" });

  for (const [name, raw] of Object.entries(attributes)) {
    const attr = await prisma.attribute.upsert({
      where: { name },
      update: {},
      create: { 
        name, 
        displayName: name,
        dataType: getAttributeDataType(raw),
        category: "PERSONAL",
        entityTypes: JSON.stringify(["STAFF"])
      },
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
  if (v instanceof Date) return { valueDate: v };
  return { valueString: String(v) };
}

function toValueUpdate(v: any) {
  return { 
    valueString: null, 
    valueNumber: null, 
    valueBool: null, 
    valueDate: null, 
    valueDateTime: null,
    valueText: null,
    ...toValueCreate(v) 
  };
}
