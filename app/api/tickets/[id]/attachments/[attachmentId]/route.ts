import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ticketAttachments } from '@/lib/db/schema';
import { requireAuth } from '@/lib/auth-utils';
import { getTicketById } from '@/lib/services/ticket-service';
import { eq } from 'drizzle-orm';
import { readFile, unlink } from 'fs/promises';
import path from 'path';

/**
 * GET /api/tickets/[id]/attachments/[attachmentId]
 * Download an attachment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id, attachmentId } = await params;

    // Check if user has access to this ticket
    const ticket = await getTicketById(id, user.id, user.role);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: '티켓을 찾을 수 없거나 접근 권한이 없습니다' },
        { status: 404 }
      );
    }

    // Get attachment
    const [attachment] = await db
      .select()
      .from(ticketAttachments)
      .where(eq(ticketAttachments.id, attachmentId))
      .limit(1);

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: '첨부파일을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // Read file
    const filePath = path.join(process.cwd(), 'public', attachment.filePath);
    const fileBuffer = await readFile(filePath);

    // Return file
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': attachment.mimeType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(
          attachment.fileName
        )}"`,
        'Content-Length': attachment.fileSize.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading attachment:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: '파일 다운로드 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tickets/[id]/attachments/[attachmentId]
 * Delete an attachment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const user = await requireAuth();
    const { id, attachmentId } = await params;

    // Check if user has access to this ticket
    const ticket = await getTicketById(id, user.id, user.role);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: '티켓을 찾을 수 없거나 접근 권한이 없습니다' },
        { status: 404 }
      );
    }

    // Only allow customer (owner) or agent/manager/admin to delete
    if (
      user.role === 'customer' &&
      ticket.customerId !== user.id
    ) {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    // Get attachment
    const [attachment] = await db
      .select()
      .from(ticketAttachments)
      .where(eq(ticketAttachments.id, attachmentId))
      .limit(1);

    if (!attachment) {
      return NextResponse.json(
        { success: false, error: '첨부파일을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // Delete file from filesystem
    try {
      const filePath = path.join(process.cwd(), 'public', attachment.filePath);
      await unlink(filePath);
    } catch (error) {
      console.error('Error deleting file from filesystem:', error);
      // Continue with database deletion even if file deletion fails
    }

    // Delete from database
    await db.delete(ticketAttachments).where(eq(ticketAttachments.id, attachmentId));

    return NextResponse.json({
      success: true,
      message: '첨부파일이 삭제되었습니다',
    });
  } catch (error) {
    console.error('Error deleting attachment:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: '첨부파일 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
