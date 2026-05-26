import { Router, type IRouter } from "express";
import { desc, sum, max, count } from "drizzle-orm";
import { db, leaderboardTable, gameSessionsTable } from "@workspace/db";
import { SubmitScoreBody } from "@workspace/api-zod";

const router: IRouter = Router();

function serializeEntry(e: typeof leaderboardTable.$inferSelect) {
  return { ...e, createdAt: e.createdAt.toISOString() };
}

router.get("/leaderboard", async (_req, res): Promise<void> => {
  const entries = await db
    .select()
    .from(leaderboardTable)
    .orderBy(desc(leaderboardTable.score))
    .limit(50);
  res.json(entries.map(serializeEntry));
});

router.post("/leaderboard", async (req, res): Promise<void> => {
  const parsed = SubmitScoreBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [entry] = await db.insert(leaderboardTable).values(parsed.data).returning();
  res.status(201).json(serializeEntry(entry));
});

router.get("/stats", async (_req, res): Promise<void> => {
  const [sessionStats] = await db.select({ total: count() }).from(gameSessionsTable);
  const [scoreStats] = await db
    .select({ totalKills: sum(leaderboardTable.kills), topScore: max(leaderboardTable.score) })
    .from(leaderboardTable);

  res.json({
    totalSessions: sessionStats?.total ?? 0,
    activePlayers: Math.floor(Math.random() * 50) + 10,
    totalKills: Number(scoreStats?.totalKills ?? 0),
    topScore: Number(scoreStats?.topScore ?? 0),
    avgSessionDuration: 18.5,
  });
});

export default router;
