import { pgTable, pgSchema, serial, numeric, integer , text,boolean,  timestamp, uuid, jsonb, pgEnum } from "drizzle-orm/pg-core";

const authSchema = pgSchema("auth");
export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const roles = pgEnum("roles", ["admin", "user"]);

// --- Tables ---
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().references(() => authUsers.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  roles: roles("roles").notNull().default("user"),
  age: integer("age"),
  address: text("address"),
  phone: text("phone"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  typeId: integer("type_id")
    .notNull()
    .references(() => typesClient.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  identifier: text("identifier").notNull(),
  company: text("company"),
  phone: text("phone"),
  email: text("email"),
  notes: text("notes"),
  status: boolean("status").notNull().default(true),

  createdBy: uuid("created_by")
    .notNull()
    .references(() => authUsers.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const licitationStatusEnum = pgEnum("licitation_status", ["borrador", "activa", "finalizada", "por_cobrar", "cobrada", "perdida"]);

export const licitations = pgTable("licitations", {
  id: serial("id").primaryKey(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  limit_date: timestamp("limit_date", { withTimezone: true }).notNull(),

  base: numeric("base", { precision: 10, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 10, scale: 2 }).notNull(),
  taxes: numeric("taxes", { precision: 10, scale: 2 }).notNull(),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),

  status: licitationStatusEnum("status").notNull().default("borrador"),
  document: text("document"), //url or path to the document (pdf, docx, etc.)
  isDocumentGenerated: boolean("is_document_generated").notNull().default(false),
  notes: text("notes"),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "restrict" }),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => authUsers.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const licitationItems = pgTable("licitation_items", {
  id: serial("id").primaryKey(),
  licitationId: integer("licitation_id")
    .notNull()
    .references(() => licitations.id, { onDelete: "cascade" }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  quantity: integer("quantity").notNull().default(1),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  taxId: integer("tax_id")
    .notNull()
    .references(() => taxes.id, { onDelete: "restrict" }),
  discountId: integer("discount_id")
    .notNull()
    .references(() => discounts.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});


export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  code: text("code").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(), 
  cost: numeric("cost", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  tags: text("tags").array().notNull().default([]),
  taxId: integer("tax_id")
    .notNull()
    .references(() => taxes.id, { onDelete: "restrict" }),
  status: boolean("status").notNull().default(true),
  createdBy: uuid("created_by")
  .notNull()
  .references(() => authUsers.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});


export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  payment_method: text("payment_method").notNull(),
  date: timestamp("date", { withTimezone: true }).notNull(),
  licitationId: integer("licitation_id")
    .notNull()
    .references(() => licitations.id, { onDelete: "restrict" }),
  clientId: integer("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "restrict" }),
  notes: text("notes"),
  createdBy: uuid("created_by")
  .notNull()
  .references(() => authUsers.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const taxes = pgTable("taxes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull(),
  createdBy: uuid("created_by")
  .notNull()
  .references(() => authUsers.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const discounts = pgTable("discounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  percentage: numeric("percentage", { precision: 5, scale: 2 }).notNull(),
  createdBy: uuid("created_by")
  .notNull()
  .references(() => authUsers.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const typesClient = pgTable("types_client", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdBy: uuid("created_by")
  .notNull()
  .references(() => authUsers.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  tableName: text("table_name").notNull(),      
  recordId: integer("record_id").notNull(),     
  action: text("action").notNull(),                  // Diferent rules for different tables
  oldData: jsonb("old_data"), //snapshot of old data before the action.                       
  modifiedBy: uuid("modified_by")
    .notNull()
    .references(() => authUsers.id),
  modifiedAt: timestamp("modified_at", { withTimezone: true }).notNull().defaultNow(),
});


// --- Types ---
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type TypeClient = typeof typesClient.$inferSelect;
export type NewTypeClient = typeof typesClient.$inferInsert;

export type Client = typeof clients.$inferSelect;
export type NewClient = typeof clients.$inferInsert;

export type Tax = typeof taxes.$inferSelect;
export type NewTax = typeof taxes.$inferInsert;

export type Discount = typeof discounts.$inferSelect;
export type NewDiscount = typeof discounts.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Licitation = typeof licitations.$inferSelect;
export type NewLicitation = typeof licitations.$inferInsert;

export type LicitationItem = typeof licitationItems.$inferSelect;
export type NewLicitationItem = typeof licitationItems.$inferInsert;

export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

export type AuditLog = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;


