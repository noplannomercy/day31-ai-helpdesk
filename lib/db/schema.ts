import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  pgEnum,
  integer,
  index
} from 'drizzle-orm/pg-core';

// ============================================================================
// ENUMS
// ============================================================================

export const userRoleEnum = pgEnum('user_role', ['customer', 'agent', 'manager', 'admin']);
export const ticketStatusEnum = pgEnum('ticket_status', ['open', 'in_progress', 'resolved', 'closed']);
export const ticketPriorityEnum = pgEnum('ticket_priority', ['low', 'medium', 'high']);

// ============================================================================
// TABLES
// ============================================================================

// 1. Users
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  role: userRoleEnum('role').notNull().default('customer'),
  isOnline: boolean('is_online').notNull().default(false),
  isAway: boolean('is_away').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => {
  return {
    emailIdx: index('users_email_idx').on(table.email),
    roleIdx: index('users_role_idx').on(table.role),
    onlineIdx: index('users_online_idx').on(table.isOnline, table.isAway),
  };
});

// 2. Categories
export const categories = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 3. Tickets
export const tickets = pgTable('tickets', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  status: ticketStatusEnum('status').notNull().default('open'),
  priority: ticketPriorityEnum('priority').notNull().default('medium'),
  categoryId: uuid('category_id').references(() => categories.id),
  customerId: uuid('customer_id').notNull().references(() => users.id),
  agentId: uuid('agent_id').references(() => users.id),
  sentiment: varchar('sentiment', { length: 20 }),
  slaResponseDeadline: timestamp('sla_response_deadline'),
  slaResolveDeadline: timestamp('sla_resolve_deadline'),
  slaResponseMet: boolean('sla_response_met'),
  slaResolveMet: boolean('sla_resolve_met'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  firstResponseAt: timestamp('first_response_at'),
  resolvedAt: timestamp('resolved_at'),
  closedAt: timestamp('closed_at'),
}, (table) => {
  return {
    statusIdx: index('tickets_status_idx').on(table.status),
    priorityIdx: index('tickets_priority_idx').on(table.priority),
    customerIdx: index('tickets_customer_idx').on(table.customerId),
    agentIdx: index('tickets_agent_idx').on(table.agentId),
    categoryIdx: index('tickets_category_idx').on(table.categoryId),
    createdAtIdx: index('tickets_created_at_idx').on(table.createdAt),
    slaResponseIdx: index('tickets_sla_response_idx').on(table.slaResponseDeadline),
    slaResolveIdx: index('tickets_sla_resolve_idx').on(table.slaResolveDeadline),
    statusAgentIdx: index('tickets_status_agent_idx').on(table.status, table.agentId),
    statusCreatedIdx: index('tickets_status_created_idx').on(table.status, table.createdAt),
  };
});

// 4. Ticket Comments
export const ticketComments = pgTable('ticket_comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  ticketId: uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  isInternal: boolean('is_internal').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => {
  return {
    ticketIdx: index('comments_ticket_idx').on(table.ticketId),
    createdAtIdx: index('comments_created_at_idx').on(table.createdAt),
  };
});

// 5. Ticket Attachments
export const ticketAttachments = pgTable('ticket_attachments', {
  id: uuid('id').defaultRandom().primaryKey(),
  ticketId: uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// 6. Ticket Histories
export const ticketHistories = pgTable('ticket_histories', {
  id: uuid('id').defaultRandom().primaryKey(),
  ticketId: uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  field: varchar('field', { length: 50 }).notNull(),
  oldValue: text('old_value'),
  newValue: text('new_value'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => {
  return {
    ticketIdx: index('histories_ticket_idx').on(table.ticketId),
    createdAtIdx: index('histories_created_at_idx').on(table.createdAt),
  };
});

// 7. AI Prompt Templates
export const aiPromptTemplates = pgTable('ai_prompt_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'cascade' }).unique(),
  systemPrompt: text('system_prompt').notNull(),
  userPromptTemplate: text('user_prompt_template').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// 8. Knowledge Bases
export const knowledgeBases = pgTable('knowledge_bases', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 200 }).notNull(),
  content: text('content').notNull(),
  categoryId: uuid('category_id').references(() => categories.id, { onDelete: 'set null' }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => {
  return {
    categoryIdx: index('kb_category_idx').on(table.categoryId),
    activeIdx: index('kb_active_idx').on(table.isActive),
  };
});

// 9. Customer Satisfactions
export const customerSatisfactions = pgTable('customer_satisfactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  ticketId: uuid('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade' }).unique(),
  rating: integer('rating').notNull(),
  feedback: text('feedback'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================================================
// TYPE EXPORTS (for TypeScript inference)
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Ticket = typeof tickets.$inferSelect;
export type NewTicket = typeof tickets.$inferInsert;

export type TicketComment = typeof ticketComments.$inferSelect;
export type NewTicketComment = typeof ticketComments.$inferInsert;

export type TicketAttachment = typeof ticketAttachments.$inferSelect;
export type NewTicketAttachment = typeof ticketAttachments.$inferInsert;

export type TicketHistory = typeof ticketHistories.$inferSelect;
export type NewTicketHistory = typeof ticketHistories.$inferInsert;

export type AIPromptTemplate = typeof aiPromptTemplates.$inferSelect;
export type NewAIPromptTemplate = typeof aiPromptTemplates.$inferInsert;

export type KnowledgeBase = typeof knowledgeBases.$inferSelect;
export type NewKnowledgeBase = typeof knowledgeBases.$inferInsert;

export type CustomerSatisfaction = typeof customerSatisfactions.$inferSelect;
export type NewCustomerSatisfaction = typeof customerSatisfactions.$inferInsert;
