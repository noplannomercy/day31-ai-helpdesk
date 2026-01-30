import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { tickets } from '@/lib/db/schema';
import { ticketCreateSchema } from '@/lib/validations';
import { requireAuth } from '@/lib/auth-utils';
import { getTickets, calculateSLADeadlines } from '@/lib/services/ticket-service';
import { autoAssignTicket } from '@/lib/services/assignment-service';
import { recordHistory } from '@/lib/services/history-service';

/**
 * GET /api/tickets
 * Get tickets list with filters
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(request.url);

    const params = {
      userId: user.id,
      userRole: user.role,
      status: searchParams.get('status') as any,
      priority: searchParams.get('priority') || undefined,
      categoryId: searchParams.get('categoryId') || undefined,
      agentId: searchParams.get('agentId') || undefined,
      customerId: searchParams.get('customerId') || undefined,
      search: searchParams.get('search') || undefined,
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '10'),
    };

    const result = await getTickets(params);

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: '티켓 목록 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tickets
 * Create a new ticket
 */
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const validated = ticketCreateSchema.parse(body);

    // Calculate SLA deadlines
    const slaDeadlines = calculateSLADeadlines();

    // Create ticket
    const [newTicket] = await db
      .insert(tickets)
      .values({
        title: validated.title,
        content: validated.content,
        priority: validated.priority,
        categoryId: validated.categoryId || null,
        customerId: user.id,
        status: 'open',
        ...slaDeadlines,
      })
      .returning();

    // Auto-assign to an available agent
    const assignedAgentId = await autoAssignTicket(newTicket.id);

    if (assignedAgentId) {
      // Record assignment in history
      await recordHistory({
        ticketId: newTicket.id,
        userId: user.id,
        field: 'agent',
        oldValue: null,
        newValue: assignedAgentId,
      });
    }

    // Record ticket creation in history
    await recordHistory({
      ticketId: newTicket.id,
      userId: user.id,
      field: 'status',
      oldValue: null,
      newValue: 'open',
    });

    return NextResponse.json(
      {
        success: true,
        data: newTicket,
        message: '티켓이 생성되었습니다',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating ticket:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: '티켓 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
