import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// File system structure
export const files = pgTable("files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  path: text("path").notNull().unique(),
  content: text("content").notNull().default(""),
  language: text("language").notNull().default("plaintext"),
  isDirectory: text("is_directory").notNull().default("false"),
  parentPath: text("parent_path"),
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
});

export type InsertFile = z.infer<typeof insertFileSchema>;
export type File = typeof files.$inferSelect;

// AI Chat messages
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  role: text("role").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  sessionId: text("session_id").notNull().default("default"),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Terminal sessions
export const terminalSessions = pgTable("terminal_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  isActive: text("is_active").notNull().default("true"),
});

export const insertTerminalSessionSchema = createInsertSchema(terminalSessions).omit({
  id: true,
});

export type InsertTerminalSession = z.infer<typeof insertTerminalSessionSchema>;
export type TerminalSession = typeof terminalSessions.$inferSelect;
