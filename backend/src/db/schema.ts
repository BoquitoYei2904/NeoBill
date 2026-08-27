import { pgTable, pgSchema, serial, text, timestamp, uuid } from "drizzle-orm/pg-core";

const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});


export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});


export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

