import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tickets } from '@/lib/db/schema';
import { ticketStatusUpdateSchema } from '@/lib/validations';
import { requireAuth } from '@/lib/auth-utils';
import { getTicketById, updateResolveSLA } from '@/lib/services/ticket-service';
import { recordHistory } from '@/lib/services/history-service';
import { eq } from 'drizzle-orm';

/**
 * PATCH /api/tickets/[id]/status
 * Update ticket status
 */
export async function PATCH(
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

    // Only agents and above can change status
    if (user.role === 'customer') {
      return NextResponse.json(
        { success: false, error: '고객은 상태를 변경할 수 없습니다' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status } = ticketStatusUpdateSchema.parse(body);

    // Prepare update data
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    // Set timestamps based on status
    if (status === 'resolved' && ticket.status !== 'resolved') {
      updateData.resolvedAt = new Date();
      // Calculate resolve SLA
      await updateResolveSLA(id);
    } else if (status === 'closed' && ticket.status !== 'closed') {
      updateData.closedAt = new Date();
    }

    // Update ticket
    const [updated] = await db
      .update(tickets)
      .set(updateData)
      .where(eq(tickets.id, id))
      .returning();

    // Record status change in history
    await recordHistory({
      ticketId: id,
      userId: user.id,
      field: 'status',
      oldValue: ticket.status,
      newValue: status,
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: '티켓 상태가 변경되었습니다',
    });
  } catch (error) {
    console.error('Error updating ticket status:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: '티켓 상태 변경 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
