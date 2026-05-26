import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, gameSessionsTable } from "@workspace/db";
import { CreateSessionBody, GetSessionParams } from "@workspace/api-zod";
import { randomBytes } from "crypto";
import { logger } from "../lib/logger";

const router: IRouter = Router();

function serializeSession(s: typeof gameSessionsTable.$inferSelect) {
  return { ...s, createdAt: s.createdAt.toISOString() };
}

router.get("/sessions", async (_req, res): Promise<void> => {
  const sessions = await db.select().from(gameSessionsTable).orderBy(desc(gameSessionsTable.createdAt)).limit(50);
  res.json(sessions.map(serializeSession));
});

router.post("/sessions", async (req, res): Promise<void> => {
  const parsed = CreateSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const id = randomBytes(8).toString("hex");
  const sessionCode = randomBytes(3).toString("hex").toUpperCase();

  const [session] = await db.insert(gameSessionsTable).values({
    id,
    name: parsed.data.name,
    gameMode: parsed.data.gameMode,
    maxPlayers: parsed.data.maxPlayers ?? 16,
    isPublic: parsed.data.isPublic ?? true,
    hostName: parsed.data.hostName ?? "Host",
    sessionCode,
    playerCount: 0,
  }).returning();

  logger.info({ sessionId: id }, "Game session created");
  res.status(201).json(serializeSession(session));
});

router.get("/sessions/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetSessionParams.safeParse({ id: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [session] = await db.select().from(gameSessionsTable).where(eq(gameSessionsTable.id, params.data.id));
  if (!session) {
    res.status(404).json({ error: "Session not found" });
    return;
  }

  res.json(serializeSession(session));
});

export default router;
