import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tickets } from '@/lib/db/schema';
import { ticketUpdateSchema } from '@/lib/validations';
import { requireAuth } from '@/lib/auth-utils';
import { getTicketById } from '@/lib/services/ticket-service';
import { recordHistory } from '@/lib/services/history-service';
import { eq } from 'drizzle-orm';

/**
 * GET /api/tickets/[id]
 * Get a single ticket by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const ticket = await getTicketById(id, user.id, user.role);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: '티켓을 찾을 수 없거나 접근 권한이 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error('Error fetching ticket:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: '티켓 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tickets/[id]
 * Update a ticket
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    // Get existing ticket
    const ticket = await getTicketById(id, user.id, user.role);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: '티켓을 찾을 수 없거나 접근 권한이 없습니다' },
        { status: 404 }
      );
    }

    // Check permissions
    if (user.role === 'customer' && ticket.customerId !== user.id) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    if (user.role === 'agent' && ticket.agentId !== user.id) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validated = ticketUpdateSchema.parse(body);

    // Record changes in history
    const historyEntries = [];

    if (validated.title && validated.title !== ticket.title) {
      historyEntries.push({
        ticketId: id,
        userId: user.id,
        field: 'title',
        oldValue: ticket.title,
        newValue: validated.title,
      });
    }

    if (validated.content && validated.content !== ticket.content) {
      historyEntries.push({
        ticketId: id,
        userId: user.id,
        field: 'content',
        oldValue: ticket.content,
        newValue: validated.content,
      });
    }

    if (validated.priority && validated.priority !== ticket.priority) {
      historyEntries.push({
        ticketId: id,
        userId: user.id,
        field: 'priority',
        oldValue: ticket.priority,
        newValue: validated.priority,
      });
    }

    if (validated.categoryId && validated.categoryId !== ticket.categoryId) {
      historyEntries.push({
        ticketId: id,
        userId: user.id,
        field: 'category',
        oldValue: ticket.categoryId || null,
        newValue: validated.categoryId,
      });
    }

    // Update ticket
    const [updated] = await db
      .update(tickets)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, id))
      .returning();

    // Record history
    if (historyEntries.length > 0) {
      await Promise.all(
        historyEntries.map((entry) => recordHistory(entry))
      );
    }

    return NextResponse.json({
      success: true,
      data: updated,
      message: '티켓이 수정되었습니다',
    });
  } catch (error) {
    console.error('Error updating ticket:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: '티켓 수정 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
