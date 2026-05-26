import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const gameSessionsTable = pgTable("game_sessions", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  playerCount: integer("player_count").notNull().default(0),
  maxPlayers: integer("max_players").notNull().default(16),
  gameMode: text("game_mode").notNull().default("deathmatch"),
  sessionCode: text("session_code").notNull(),
  isPublic: boolean("is_public").notNull().default(true),
  hostName: text("host_name").notNull().default("Host"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertGameSessionSchema = createInsertSchema(gameSessionsTable).omit({ playerCount: true, createdAt: true });
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type GameSession = typeof gameSessionsTable.$inferSelect;
