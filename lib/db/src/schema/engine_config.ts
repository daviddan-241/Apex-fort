import { pgTable, serial, timestamp, boolean, doublePrecision, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const engineConfigTable = pgTable("engine_config", {
  id: serial("id").primaryKey(),
  movementSpeed: doublePrecision("movement_speed").notNull().default(5),
  sprintMultiplier: doublePrecision("sprint_multiplier").notNull().default(1.8),
  jumpHeight: doublePrecision("jump_height").notNull().default(8),
  gravity: doublePrecision("gravity").notNull().default(20),
  fogEnabled: boolean("fog_enabled").notNull().default(true),
  fogDensity: doublePrecision("fog_density").notNull().default(0.01),
  bloomEnabled: boolean("bloom_enabled").notNull().default(true),
  bloomIntensity: doublePrecision("bloom_intensity").notNull().default(0.5),
  cameraMode: text("camera_mode").notNull().default("third_person"),
  fov: doublePrecision("fov").notNull().default(75),
  bulletDamage: doublePrecision("bullet_damage").notNull().default(25),
  reloadTime: doublePrecision("reload_time").notNull().default(2),
  ambientLight: doublePrecision("ambient_light").notNull().default(0.4),
  shadowsEnabled: boolean("shadows_enabled").notNull().default(true),
  particlesEnabled: boolean("particles_enabled").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertEngineConfigSchema = createInsertSchema(engineConfigTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertEngineConfig = z.infer<typeof insertEngineConfigSchema>;
export type EngineConfig = typeof engineConfigTable.$inferSelect;
