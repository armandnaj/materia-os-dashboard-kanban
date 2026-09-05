import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const groups = sqliteTable("groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  position: integer("position").notNull().default(0),
});

export const statuses = sqliteTable("statuses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  position: integer("position").notNull().default(0),
});

export const cards = sqliteTable("cards", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  role: text("role").notNull().default(""),
  dueDate: text("due_date"),
  outcome: text("outcome").notNull().default(""),
  links: text("links").notNull().default(""),
  caseId: integer("case_id"),
  isFocus: integer("is_focus", { mode: "boolean" }).notNull().default(false),
  groupId: integer("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  statusId: integer("status_id").notNull().references(() => statuses.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const seedBatches = sqliteTable("seed_batches", {
  key: text("key").primaryKey(),
  appliedAt: text("applied_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const cases = sqliteTable("cases", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  category: text("category").notNull().default("Кейс"),
  hypothesis: text("hypothesis").notNull().default(""),
  action: text("action").notNull().default(""),
  result: text("result").notNull().default(""),
  takeaway: text("takeaway").notNull().default(""),
  stage: text("stage").notNull().default("Проверено"),
  period: text("period").notNull().default(""),
  position: integer("position").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const caseImages = sqliteTable("case_images", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  caseId: integer("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  objectKey: text("object_key").notNull().unique(),
  filename: text("filename").notNull(),
  contentType: text("content_type").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("idx_case_images_case_id").on(table.caseId)]);
