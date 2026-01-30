import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { knowledgeBases, categories } from '@/lib/db/schema';
import { knowledgeBaseUpdateSchema } from '@/lib/validations';
import { requireManagerOrAdmin } from '@/lib/auth-utils';
import { eq } from 'drizzle-orm';

/**
 * GET /api/knowledge-base/[id]
 * Get a specific knowledge base entry
 * Access: Manager, Admin, Agents (Read only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [knowledgeBase] = await db
      .select({
        id: knowledgeBases.id,
        title: knowledgeBases.title,
        content: knowledgeBases.content,
        categoryId: knowledgeBases.categoryId,
        isActive: knowledgeBases.isActive,
        createdAt: knowledgeBases.createdAt,
        updatedAt: knowledgeBases.updatedAt,
        categoryName: categories.name,
      })
      .from(knowledgeBases)
      .leftJoin(categories, eq(knowledgeBases.categoryId, categories.id))
      .where(eq(knowledgeBases.id, id))
      .limit(1);

    if (!knowledgeBase) {
      return NextResponse.json(
        { success: false, error: '지식베이스를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: knowledgeBase,
    });
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    return NextResponse.json(
      { success: false, error: '지식베이스 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/knowledge-base/[id]
 * Update a knowledge base entry
 * Access: Manager, Admin only
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check manager or admin permission
    await requireManagerOrAdmin();

    const { id } = await params;
    const body = await request.json();
    const validated = knowledgeBaseUpdateSchema.parse(body);

    // Check if knowledge base exists
    const [existing] = await db
      .select()
      .from(knowledgeBases)
      .where(eq(knowledgeBases.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '지식베이스를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // Verify category exists if provided
    if (validated.categoryId) {
      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, validated.categoryId))
        .limit(1);

      if (!category) {
        return NextResponse.json(
          { success: false, error: '존재하지 않는 카테고리입니다' },
          { status: 400 }
        );
      }
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (validated.title !== undefined) {
      updateData.title = validated.title;
    }
    if (validated.content !== undefined) {
      updateData.content = validated.content;
    }
    if (validated.categoryId !== undefined) {
      updateData.categoryId = validated.categoryId || null;
    }
    if (validated.isActive !== undefined) {
      updateData.isActive = validated.isActive;
    }

    const [updated] = await db
      .update(knowledgeBases)
      .set(updateData)
      .where(eq(knowledgeBases.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updated,
      message: '지식베이스가 수정되었습니다',
    });
  } catch (error) {
    console.error('Error updating knowledge base:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: '지식베이스 수정 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/knowledge-base/[id]
 * Delete a knowledge base entry
 * Access: Admin only
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check manager or admin permission
    await requireManagerOrAdmin();

    const { id } = await params;

    // Check if knowledge base exists
    const [existing] = await db
      .select()
      .from(knowledgeBases)
      .where(eq(knowledgeBases.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '지식베이스를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    await db.delete(knowledgeBases).where(eq(knowledgeBases.id, id));

    return NextResponse.json({
      success: true,
      message: '지식베이스가 삭제되었습니다',
    });
  } catch (error) {
    console.error('Error deleting knowledge base:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json(
        { success: false, error: '권한이 없습니다' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: '지식베이스 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
