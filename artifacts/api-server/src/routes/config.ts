import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, engineConfigTable } from "@workspace/db";
import { UpdateConfigBody } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function serializeConfig(c: typeof engineConfigTable.$inferSelect) {
  return {
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

async function ensureConfig() {
  const [existing] = await db.select().from(engineConfigTable).limit(1);
  if (existing) return existing;
  const [created] = await db.insert(engineConfigTable).values({}).returning();
  logger.info("Engine config initialized with defaults");
  return created;
}

router.get("/config", async (_req, res): Promise<void> => {
  const config = await ensureConfig();
  res.json(serializeConfig(config));
});

router.patch("/config", async (req, res): Promise<void> => {
  const parsed = UpdateConfigBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const config = await ensureConfig();

  const [updated] = await db
    .update(engineConfigTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(engineConfigTable.id, config.id))
    .returning();

  res.json(serializeConfig(updated));
});

export default router;
