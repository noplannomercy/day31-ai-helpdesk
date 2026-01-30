import { db } from '@/lib/db';
import { tickets, users } from '@/lib/db/schema';
import { eq, and, or, isNull, lte, gte } from 'drizzle-orm';

/**
 * SLA Targets:
 * - Response SLA: 1 hour from ticket creation
 * - Resolve SLA: 24 hours from ticket creation
 */
const SLA_RESPONSE_HOURS = 1;
const SLA_RESOLVE_HOURS = 24;
const SLA_WARNING_MINUTES = 30; // Warning 30 minutes before deadline

export interface SLADeadlines {
  responseDeadline: Date;
  resolveDeadline: Date;
}

export interface TicketWithSLA {
  id: string;
  title: string;
  status: string;
  priority: string;
  agentId: string | null;
  agentName: string | null;
  agentEmail: string | null;
  slaResponseDeadline: Date | null;
  slaResolveDeadline: Date | null;
  slaResponseMet: boolean | null;
  slaResolveMet: boolean | null;
  createdAt: Date;
  firstResponseAt: Date | null;
  resolvedAt: Date | null;
}

/**
 * Calculate SLA deadlines for a new ticket
 */
export function calculateSLADeadlines(createdAt: Date = new Date()): SLADeadlines {
  const responseDeadline = new Date(createdAt);
  responseDeadline.setHours(responseDeadline.getHours() + SLA_RESPONSE_HOURS);

  const resolveDeadline = new Date(createdAt);
  resolveDeadline.setHours(resolveDeadline.getHours() + SLA_RESOLVE_HOURS);

  return {
    responseDeadline,
    resolveDeadline,
  };
}

/**
 * Check if response SLA is met
 */
export function isResponseSLAMet(
  responseTime: Date,
  deadline: Date
): boolean {
  return responseTime <= deadline;
}

/**
 * Check if resolve SLA is met
 */
export function isResolveSLAMet(
  resolveTime: Date,
  deadline: Date
): boolean {
  return resolveTime <= deadline;
}

/**
 * Get tickets approaching response SLA deadline (within warning window)
 */
export async function getTicketsApproachingResponseSLA(): Promise<TicketWithSLA[]> {
  const now = new Date();
  const warningTime = new Date(now);
  warningTime.setMinutes(warningTime.getMinutes() + SLA_WARNING_MINUTES);

  try {
    const results = await db
      .select({
        id: tickets.id,
        title: tickets.title,
        status: tickets.status,
        priority: tickets.priority,
        agentId: tickets.agentId,
        agentName: users.name,
        agentEmail: users.email,
        slaResponseDeadline: tickets.slaResponseDeadline,
        slaResolveDeadline: tickets.slaResolveDeadline,
        slaResponseMet: tickets.slaResponseMet,
        slaResolveMet: tickets.slaResolveMet,
        createdAt: tickets.createdAt,
        firstResponseAt: tickets.firstResponseAt,
        resolvedAt: tickets.resolvedAt,
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.agentId, users.id))
      .where(
        and(
          // Ticket is still open or in progress
          or(eq(tickets.status, 'open'), eq(tickets.status, 'in_progress')),
          // No first response yet
          isNull(tickets.firstResponseAt),
          // SLA not yet evaluated
          isNull(tickets.slaResponseMet),
          // Deadline is set and approaching
          lte(tickets.slaResponseDeadline, warningTime),
          gte(tickets.slaResponseDeadline, now)
        )
      );

    return results as TicketWithSLA[];
  } catch (error) {
    console.error('Error fetching tickets approaching response SLA:', error);
    return [];
  }
}

/**
 * Get tickets approaching resolve SLA deadline (within warning window)
 */
export async function getTicketsApproachingResolveSLA(): Promise<TicketWithSLA[]> {
  const now = new Date();
  const warningTime = new Date(now);
  warningTime.setMinutes(warningTime.getMinutes() + SLA_WARNING_MINUTES);

  try {
    const results = await db
      .select({
        id: tickets.id,
        title: tickets.title,
        status: tickets.status,
        priority: tickets.priority,
        agentId: tickets.agentId,
        agentName: users.name,
        agentEmail: users.email,
        slaResponseDeadline: tickets.slaResponseDeadline,
        slaResolveDeadline: tickets.slaResolveDeadline,
        slaResponseMet: tickets.slaResponseMet,
        slaResolveMet: tickets.slaResolveMet,
        createdAt: tickets.createdAt,
        firstResponseAt: tickets.firstResponseAt,
        resolvedAt: tickets.resolvedAt,
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.agentId, users.id))
      .where(
        and(
          // Ticket is still open or in progress
          or(eq(tickets.status, 'open'), eq(tickets.status, 'in_progress')),
          // Not resolved yet
          isNull(tickets.resolvedAt),
          // SLA not yet evaluated
          isNull(tickets.slaResolveMet),
          // Deadline is set and approaching
          lte(tickets.slaResolveDeadline, warningTime),
          gte(tickets.slaResolveDeadline, now)
        )
      );

    return results as TicketWithSLA[];
  } catch (error) {
    console.error('Error fetching tickets approaching resolve SLA:', error);
    return [];
  }
}

/**
 * Get tickets that have violated response SLA
 */
export async function getTicketsViolatedResponseSLA(): Promise<TicketWithSLA[]> {
  const now = new Date();

  try {
    const results = await db
      .select({
        id: tickets.id,
        title: tickets.title,
        status: tickets.status,
        priority: tickets.priority,
        agentId: tickets.agentId,
        agentName: users.name,
        agentEmail: users.email,
        slaResponseDeadline: tickets.slaResponseDeadline,
        slaResolveDeadline: tickets.slaResolveDeadline,
        slaResponseMet: tickets.slaResponseMet,
        slaResolveMet: tickets.slaResolveMet,
        createdAt: tickets.createdAt,
        firstResponseAt: tickets.firstResponseAt,
        resolvedAt: tickets.resolvedAt,
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.agentId, users.id))
      .where(
        and(
          // Ticket is still open or in progress
          or(eq(tickets.status, 'open'), eq(tickets.status, 'in_progress')),
          // No first response yet
          isNull(tickets.firstResponseAt),
          // SLA not yet evaluated
          isNull(tickets.slaResponseMet),
          // Deadline has passed
          lte(tickets.slaResponseDeadline, now)
        )
      );

    return results as TicketWithSLA[];
  } catch (error) {
    console.error('Error fetching tickets with violated response SLA:', error);
    return [];
  }
}

/**
 * Get tickets that have violated resolve SLA
 */
export async function getTicketsViolatedResolveSLA(): Promise<TicketWithSLA[]> {
  const now = new Date();

  try {
    const results = await db
      .select({
        id: tickets.id,
        title: tickets.title,
        status: tickets.status,
        priority: tickets.priority,
        agentId: tickets.agentId,
        agentName: users.name,
        agentEmail: users.email,
        slaResponseDeadline: tickets.slaResponseDeadline,
        slaResolveDeadline: tickets.slaResolveDeadline,
        slaResponseMet: tickets.slaResponseMet,
        slaResolveMet: tickets.slaResolveMet,
        createdAt: tickets.createdAt,
        firstResponseAt: tickets.firstResponseAt,
        resolvedAt: tickets.resolvedAt,
      })
      .from(tickets)
      .leftJoin(users, eq(tickets.agentId, users.id))
      .where(
        and(
          // Ticket is still open or in progress
          or(eq(tickets.status, 'open'), eq(tickets.status, 'in_progress')),
          // Not resolved yet
          isNull(tickets.resolvedAt),
          // SLA not yet evaluated
          isNull(tickets.slaResolveMet),
          // Deadline has passed
          lte(tickets.slaResolveDeadline, now)
        )
      );

    return results as TicketWithSLA[];
  } catch (error) {
    console.error('Error fetching tickets with violated resolve SLA:', error);
    return [];
  }
}

/**
 * Calculate minutes until deadline
 */
export function getMinutesUntilDeadline(deadline: Date): number {
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  return Math.floor(diffMs / 60000);
}

/**
 * Calculate minutes overdue
 */
export function getMinutesOverdue(deadline: Date): number {
  const now = new Date();
  const diffMs = now.getTime() - deadline.getTime();
  return Math.floor(diffMs / 60000);
}

/**
 * Update response SLA status when first response is made
 */
export async function updateResponseSLA(
  ticketId: string,
  responseTime: Date
): Promise<void> {
  try {
    const ticket = await db.query.tickets.findFirst({
      where: eq(tickets.id, ticketId),
    });

    if (!ticket || !ticket.slaResponseDeadline) {
      return;
    }

    const isMet = isResponseSLAMet(responseTime, ticket.slaResponseDeadline);

    await db
      .update(tickets)
      .set({
        slaResponseMet: isMet,
        firstResponseAt: responseTime,
      })
      .where(eq(tickets.id, ticketId));
  } catch (error) {
    console.error('Error updating response SLA:', error);
  }
}

/**
 * Update resolve SLA status when ticket is resolved
 */
export async function updateResolveSLA(
  ticketId: string,
  resolveTime: Date
): Promise<void> {
  try {
    const ticket = await db.query.tickets.findFirst({
      where: eq(tickets.id, ticketId),
    });

    if (!ticket || !ticket.slaResolveDeadline) {
      return;
    }

    const isMet = isResolveSLAMet(resolveTime, ticket.slaResolveDeadline);

    await db
      .update(tickets)
      .set({
        slaResolveMet: isMet,
        resolvedAt: resolveTime,
      })
      .where(eq(tickets.id, ticketId));
  } catch (error) {
    console.error('Error updating resolve SLA:', error);
  }
}
