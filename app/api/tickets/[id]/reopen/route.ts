import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tickets } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth-utils';
import { getTicketById, canReopenTicket } from '@/lib/services/ticket-service';
import { recordHistory } from '@/lib/services/history-service';
import { eq } from 'drizzle-orm';

/**
 * POST /api/tickets/[id]/reopen
 * Reopen a closed ticket (within 3 days)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Check if user has access to this ticket
    const ticket = await getTicketById(id, user.id, user.role);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: '티켓을 찾을 수 없거나 접근 권한이 없습니다' },
        { status: 404 }
      );
    }

    // Check if ticket is closed
    if (ticket.status !== 'closed') {
      return NextResponse.json(
        { success: false, error: '닫힌 티켓만 재오픈할 수 있습니다' },
        { status: 400 }
      );
    }

    // Check if ticket can be reopened (within 3 days)
    if (!canReopenTicket(ticket.closedAt)) {
      return NextResponse.json(
        { success: false, error: '티켓은 닫힌 후 3일 이내에만 재오픈할 수 있습니다' },
        { status: 400 }
      );
    }

    // Reopen ticket
    const [updated] = await db
      .update(tickets)
      .set({
        status: 'open',
        closedAt: null,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, id))
      .returning();

    // Record reopen in history
    await recordHistory({
      ticketId: id,
      userId: user.id,
      field: 'status',
      oldValue: 'closed',
      newValue: 'open',
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: '티켓이 재오픈되었습니다',
    });
  } catch (error) {
    console.error('Error reopening ticket:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: '티켓 재오픈 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
