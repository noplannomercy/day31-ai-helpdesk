import { db } from '@/lib/db';
import { tickets, users, categories, ticketComments, ticketAttachments } from '@/lib/db/schema';
import { eq, and, or, desc, count, ilike, sql } from 'drizzle-orm';
import { SLA_RESPONSE_TIME, SLA_RESOLVE_TIME, REOPEN_WINDOW } from '@/lib/constants';
import type { TicketStatus, UserRole, TicketWithRelations } from '@/lib/types';

/**
 * Get tickets with filters and pagination
 */
export async function getTickets(params: {
  userId: string;
  userRole: UserRole;
  status?: TicketStatus;
  priority?: string;
  categoryId?: string;
  agentId?: string;
  customerId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  const {
    userId,
    userRole,
    status,
    priority,
    categoryId,
    agentId,
    customerId,
    search,
    page = 1,
    pageSize = 10,
  } = params;

  const offset = (page - 1) * pageSize;

  // Build WHERE conditions based on role
  const conditions = [];

  // Role-based filtering
  if (userRole === 'customer') {
    conditions.push(eq(tickets.customerId, userId));
  } else if (userRole === 'agent') {
    conditions.push(eq(tickets.agentId, userId));
  }
  // Manager and Admin can see all tickets

  // Additional filters
  if (status) {
    conditions.push(eq(tickets.status, status));
  }
  if (priority) {
    conditions.push(eq(tickets.priority, priority as any));
  }
  if (categoryId) {
    conditions.push(eq(tickets.categoryId, categoryId));
  }
  if (agentId) {
    conditions.push(eq(tickets.agentId, agentId));
  }
  if (customerId) {
    conditions.push(eq(tickets.customerId, customerId));
  }
  if (search) {
    conditions.push(
      or(
        ilike(tickets.title, `%${search}%`),
        ilike(tickets.content, `%${search}%`)
      )
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const [{ totalCount }] = await db
    .select({ totalCount: count() })
    .from(tickets)
    .where(whereClause);

  // Get tickets with relations
  const ticketList = await db
    .select({
      ticket: tickets,
      customer: users,
      agent: users,
      category: categories,
    })
    .from(tickets)
    .leftJoin(users, eq(tickets.customerId, users.id))
    .leftJoin(categories, eq(tickets.categoryId, categories.id))
    .where(whereClause)
    .orderBy(desc(tickets.createdAt))
    .limit(pageSize)
    .offset(offset);

  // Get comment and attachment counts for each ticket
  const ticketsWithCounts = await Promise.all(
    ticketList.map(async ({ ticket, customer, agent, category }) => {
      const [commentsCount] = await db
        .select({ count: count() })
        .from(ticketComments)
        .where(eq(ticketComments.ticketId, ticket.id));

      const [attachmentsCount] = await db
        .select({ count: count() })
        .from(ticketAttachments)
        .where(eq(ticketAttachments.ticketId, ticket.id));

      return {
        ...ticket,
        customer: customer!,
        agent: agent || null,
        category: category || null,
        commentsCount: commentsCount?.count || 0,
        attachmentsCount: attachmentsCount?.count || 0,
      } as TicketWithRelations;
    })
  );

  return {
    data: ticketsWithCounts,
    total: totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
  };
}

/**
 * Get a single ticket by ID with relations
 */
export async function getTicketById(
  ticketId: string,
  userId: string,
  userRole: UserRole
): Promise<TicketWithRelations | null> {
  const [result] = await db
    .select({
      ticket: tickets,
      customer: users,
      agent: users,
      category: categories,
    })
    .from(tickets)
    .leftJoin(users, eq(tickets.customerId, users.id))
    .leftJoin(categories, eq(tickets.categoryId, categories.id))
    .where(eq(tickets.id, ticketId))
    .limit(1);

  if (!result) {
    return null;
  }

  const { ticket, customer, agent, category } = result;

  // Check access permissions
  if (userRole === 'customer' && ticket.customerId !== userId) {
    return null;
  }
  if (userRole === 'agent' && ticket.agentId !== userId) {
    return null;
  }

  // Get counts
  const [commentsCount] = await db
    .select({ count: count() })
    .from(ticketComments)
    .where(eq(ticketComments.ticketId, ticket.id));

  const [attachmentsCount] = await db
    .select({ count: count() })
    .from(ticketAttachments)
    .where(eq(ticketAttachments.ticketId, ticket.id));

  return {
    ...ticket,
    customer: customer!,
    agent: agent || null,
    category: category || null,
    commentsCount: commentsCount?.count || 0,
    attachmentsCount: attachmentsCount?.count || 0,
  };
}

/**
 * Calculate SLA deadlines for a new ticket
 */
export function calculateSLADeadlines(createdAt: Date = new Date()) {
  return {
    slaResponseDeadline: new Date(createdAt.getTime() + SLA_RESPONSE_TIME),
    slaResolveDeadline: new Date(createdAt.getTime() + SLA_RESOLVE_TIME),
  };
}

/**
 * Check if a ticket can be reopened (within 3 days of closing)
 */
export function canReopenTicket(closedAt: Date | null): boolean {
  if (!closedAt) return false;

  const now = new Date();
  const timeSinceClosed = now.getTime() - closedAt.getTime();

  return timeSinceClosed <= REOPEN_WINDOW;
}

/**
 * Update SLA status when first response is made
 */
export async function updateFirstResponseSLA(ticketId: string) {
  const [ticket] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);

  if (!ticket || ticket.firstResponseAt) {
    return; // Already has first response
  }

  const now = new Date();
  const slaResponseMet =
    ticket.slaResponseDeadline ? now <= ticket.slaResponseDeadline : null;

  await db
    .update(tickets)
    .set({
      firstResponseAt: now,
      slaResponseMet,
      updatedAt: now,
    })
    .where(eq(tickets.id, ticketId));
}

/**
 * Update SLA status when ticket is resolved
 */
export async function updateResolveSLA(ticketId: string) {
  const [ticket] = await db
    .select()
    .from(tickets)
    .where(eq(tickets.id, ticketId))
    .limit(1);

  if (!ticket) {
    return;
  }

  const now = new Date();
  const slaResolveMet =
    ticket.slaResolveDeadline ? now <= ticket.slaResolveDeadline : null;

  await db
    .update(tickets)
    .set({
      resolvedAt: now,
      slaResolveMet,
      updatedAt: now,
    })
    .where(eq(tickets.id, ticketId));
}
