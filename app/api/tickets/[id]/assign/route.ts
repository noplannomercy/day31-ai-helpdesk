import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tickets, users } from '@/lib/db/schema';
import { ticketAssignSchema } from '@/lib/validations';
import { requireAuth } from '@/lib/auth-utils';
import { getTicketById } from '@/lib/services/ticket-service';
import { recordHistory } from '@/lib/services/history-service';
import { eq, and } from 'drizzle-orm';

/**
 * PATCH /api/tickets/[id]/assign
 * Assign or reassign a ticket to an agent
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Only agents, managers, and admins can assign tickets
    if (user.role === 'customer') {
      return NextResponse.json(
        { success: false, error: '고객은 티켓을 할당할 수 없습니다' },
        { status: 403 }
      );
    }

    // Check if ticket exists
    const ticket = await getTicketById(id, user.id, user.role);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: '티켓을 찾을 수 없거나 접근 권한이 없습니다' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { agentId } = ticketAssignSchema.parse(body);

    // Verify that the target user is an agent
    const [targetAgent] = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.id, agentId),
          eq(users.role, 'agent')
        )
      )
      .limit(1);

    if (!targetAgent) {
      return NextResponse.json(
        { success: false, error: '유효한 상담원이 아닙니다' },
        { status: 400 }
      );
    }

    // Update ticket assignment
    const [updated] = await db
      .update(tickets)
      .set({
        agentId,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, id))
      .returning();

    // Record assignment change in history
    await recordHistory({
      ticketId: id,
      userId: user.id,
      field: 'agent',
      oldValue: ticket.agentId || null,
      newValue: agentId,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: '티켓이 할당되었습니다',
    });
  } catch (error) {
    console.error('Error assigning ticket:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: '티켓 할당 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
