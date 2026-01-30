import { db } from '@/lib/db';
import { users, tickets } from '@/lib/db/schema';
import { eq, and, isNull, count, ne } from 'drizzle-orm';

/**
 * Get all online agents who are not away
 */
export async function getAvailableAgents() {
  return await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.role, 'agent'),
        eq(users.isOnline, true),
        eq(users.isAway, false)
      )
    );
}

/**
 * Get agent with least assigned open/in-progress tickets
 */
export async function getNextAgentByRoundRobin(): Promise<string | null> {
  const availableAgents = await getAvailableAgents();

  if (availableAgents.length === 0) {
    return null;
  }

  // Count open/in_progress tickets for each agent
  const agentTicketCounts = await Promise.all(
    availableAgents.map(async (agent) => {
      const [result] = await db
        .select({ count: count() })
        .from(tickets)
        .where(
          and(
            eq(tickets.agentId, agent.id),
            ne(tickets.status, 'closed'),
            ne(tickets.status, 'resolved')
          )
        );

      return {
        agentId: agent.id,
        ticketCount: result?.count || 0,
      };
    })
  );

  // Sort by ticket count (ascending) and return the agent with least tickets
  agentTicketCounts.sort((a, b) => a.ticketCount - b.ticketCount);

  return agentTicketCounts[0]?.agentId || null;
}

/**
 * Auto-assign ticket to an available agent using round-robin
 */
export async function autoAssignTicket(ticketId: string): Promise<string | null> {
  const agentId = await getNextAgentByRoundRobin();

  if (!agentId) {
    return null;
  }

  // Update ticket with assigned agent
  await db
    .update(tickets)
    .set({
      agentId,
      updatedAt: new Date(),
    })
    .where(eq(tickets.id, ticketId));

  return agentId;
}

/**
 * Reassign tickets when an agent goes offline or away
 */
export async function reassignAgentTickets(agentId: string): Promise<number> {
  // Get all open/in_progress tickets assigned to this agent
  const agentTickets = await db
    .select()
    .from(tickets)
    .where(
      and(
        eq(tickets.agentId, agentId),
        ne(tickets.status, 'closed'),
        ne(tickets.status, 'resolved')
      )
    );

  let reassignedCount = 0;

  for (const ticket of agentTickets) {
    const newAgentId = await getNextAgentByRoundRobin();

    if (newAgentId && newAgentId !== agentId) {
      await db
        .update(tickets)
        .set({
          agentId: newAgentId,
          updatedAt: new Date(),
        })
        .where(eq(tickets.id, ticket.id));

      reassignedCount++;
    }
  }

  return reassignedCount;
}
