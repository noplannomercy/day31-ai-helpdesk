import { db } from '@/lib/db';
import { ticketHistories } from '@/lib/db/schema';

/**
 * Record a change in ticket history
 */
export async function recordHistory(params: {
  ticketId: string;
  userId: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
}): Promise<void> {
  await db.insert(ticketHistories).values({
    ticketId: params.ticketId,
    userId: params.userId,
    field: params.field,
    oldValue: params.oldValue,
    newValue: params.newValue,
  });
}

/**
 * Record multiple history entries
 */
export async function recordHistories(
  entries: Array<{
    ticketId: string;
    userId: string;
    field: string;
    oldValue: string | null;
    newValue: string | null;
  }>
): Promise<void> {
  if (entries.length === 0) return;
  await db.insert(ticketHistories).values(entries);
}
