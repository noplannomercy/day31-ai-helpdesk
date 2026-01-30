import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ticketAttachments } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth-utils';
import { getTicketById } from '@/lib/services/ticket-service';
import { uploadFile } from '@/lib/upload';
import { eq } from 'drizzle-orm';

/**
 * GET /api/tickets/[id]/attachments
 * Get all attachments for a ticket
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

    const attachments = await db
      .select()
      .from(ticketAttachments)
      .where(eq(ticketAttachments.ticketId, id))
      .orderBy(ticketAttachments.createdAt);

    return NextResponse.json({
      success: true,
      data: attachments,
    });
  } catch (error) {
    console.error('Error fetching attachments:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: '첨부파일 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tickets/[id]/attachments
 * Upload an attachment to a ticket
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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: '파일이 제공되지 않았습니다' },
        { status: 400 }
      );
    }

    // Upload file
    const uploadResult = await uploadFile(file);

    if (!uploadResult.success) {
      return NextResponse.json(
        { success: false, error: uploadResult.error },
        { status: 400 }
      );
    }

    // Save attachment record
    const [newAttachment] = await db
      .insert(ticketAttachments)
      .values({
        ticketId: id,
        fileName: uploadResult.fileName!,
        filePath: uploadResult.filePath!,
        fileSize: file.size,
        mimeType: file.type,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newAttachment,
        message: '파일이 업로드되었습니다',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error uploading attachment:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: '파일 업로드 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
