import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ticketComments, users } from '@/lib/db/schema';
import { commentCreateSchema } from '@/lib/validations';
import { requireAuth } from '@/lib/auth-utils';
import { getTicketById, updateFirstResponseSLA } from '@/lib/services/ticket-service';
import { eq, desc } from 'drizzle-orm';

/**
 * GET /api/tickets/[id]/comments
 * Get all comments for a ticket
 */
export async function GET(
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

    // Get comments with author info
    const comments = await db
      .select({
        comment: ticketComments,
        author: users,
      })
      .from(ticketComments)
      .leftJoin(users, eq(ticketComments.userId, users.id))
      .where(eq(ticketComments.ticketId, id))
      .orderBy(ticketComments.createdAt);

    // Filter out internal comments for customers
    const filteredComments = comments
      .filter((c) => {
        if (user.role === 'customer') {
          return !c.comment.isInternal;
        }
        return true;
      })
      .map(({ comment, author }) => ({
        ...comment,
        author: {
          id: author!.id,
          name: author!.name,
          email: author!.email,
          role: author!.role,
        },
      }));

    return NextResponse.json({
      success: true,
      data: filteredComments,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: '댓글 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tickets/[id]/comments
 * Add a comment to a ticket
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

    const body = await request.json();
    const validated = commentCreateSchema.parse(body);

    // Customers cannot create internal notes
    if (user.role === 'customer' && validated.isInternal) {
      return NextResponse.json(
        { success: false, error: '고객은 내부 노트를 작성할 수 없습니다' },
        { status: 403 }
      );
    }

    // Create comment
    const [newComment] = await db
      .insert(ticketComments)
      .values({
        ticketId: id,
        userId: user.id,
        content: validated.content,
        isInternal: validated.isInternal,
      })
      .returning();

    // Update first response SLA if this is agent's first response
    if (
      !validated.isInternal &&
      (user.role === 'agent' || user.role === 'manager' || user.role === 'admin')
    ) {
      await updateFirstResponseSLA(id);
    }

    return NextResponse.json(
      {
        success: true,
        data: newComment,
        message: '댓글이 추가되었습니다',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating comment:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: '댓글 추가 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
