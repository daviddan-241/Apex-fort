import {
  pgTable,
  text,
  integer,
  timestamp,
  jsonb,
  serial,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const projectsTable = pgTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  prompt: text("prompt").notNull(),
  genre: text("genre"),
  status: text("status").notNull().default("pending"),
  progress: integer("progress").notNull().default(0),
  engine: text("engine").notNull().default("UE5"),
  platform: text("platform"),
  gameDesign: text("game_design"),
  features: jsonb("features").$type<string[]>().default([]),
  fileCount: integer("file_count").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at"),
});

export const agentLogsTable = pgTable("agent_logs", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull(),
  agentId: text("agent_id").notNull(),
  agentName: text("agent_name").notNull(),
  level: text("level").notNull().default("info"),
  message: text("message").notNull(),
  phase: text("phase"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const generatedFilesTable = pgTable("generated_files", {
  id: serial("id").primaryKey(),
  projectId: text("project_id").notNull(),
  path: text("path").notNull(),
  type: text("type").notNull(),
  size: integer("size").notNull().default(0),
  content: text("content"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const uploadedFilesTable = pgTable("uploaded_files", {
  id: text("id").primaryKey(),
  projectId: text("project_id"),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  storagePath: text("storage_path").notNull(),
  analysisResult: jsonb("analysis_result"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertProjectSchema = createInsertSchema(projectsTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const insertAgentLogSchema = createInsertSchema(agentLogsTable).omit({
  createdAt: true,
});
export const insertGeneratedFileSchema = createInsertSchema(
  generatedFilesTable
).omit({ id: true, createdAt: true });
export const insertUploadedFileSchema = createInsertSchema(
  uploadedFilesTable
).omit({ createdAt: true });

export type Project = typeof projectsTable.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type AgentLog = typeof agentLogsTable.$inferSelect;
export type InsertAgentLog = z.infer<typeof insertAgentLogSchema>;
export type GeneratedFile = typeof generatedFilesTable.$inferSelect;
export type InsertGeneratedFile = z.infer<typeof insertGeneratedFileSchema>;
export type UploadedFile = typeof uploadedFilesTable.$inferSelect;
export type InsertUploadedFile = z.infer<typeof insertUploadedFileSchema>;
