import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiPromptTemplates, categories } from '@/lib/db/schema';
import { aiTemplateUpdateSchema } from '@/lib/validations';
import { requireAdmin } from '@/lib/auth-utils';
import { eq } from 'drizzle-orm';

/**
 * GET /api/templates/[id]
 * Get a specific AI prompt template
 * Access: Admin only
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin permission
    await requireAdmin();

    const { id } = await params;

    const [template] = await db
      .select({
        id: aiPromptTemplates.id,
        categoryId: aiPromptTemplates.categoryId,
        systemPrompt: aiPromptTemplates.systemPrompt,
        userPromptTemplate: aiPromptTemplates.userPromptTemplate,
        createdAt: aiPromptTemplates.createdAt,
        updatedAt: aiPromptTemplates.updatedAt,
        categoryName: categories.name,
      })
      .from(aiPromptTemplates)
      .leftJoin(categories, eq(aiPromptTemplates.categoryId, categories.id))
      .where(eq(aiPromptTemplates.id, id))
      .limit(1);

    if (!template) {
      return NextResponse.json(
        { success: false, error: 'AI 템플릿을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error) {
    console.error('Error fetching AI template:', error);

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
      { success: false, error: 'AI 템플릿 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/templates/[id]
 * Update an AI prompt template
 * Access: Admin only
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin permission
    await requireAdmin();

    const { id } = await params;
    const body = await request.json();
    const validated = aiTemplateUpdateSchema.parse(body);

    // Check if template exists
    const [existing] = await db
      .select()
      .from(aiPromptTemplates)
      .where(eq(aiPromptTemplates.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'AI 템플릿을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (validated.systemPrompt !== undefined) {
      updateData.systemPrompt = validated.systemPrompt;
    }
    if (validated.userPromptTemplate !== undefined) {
      updateData.userPromptTemplate = validated.userPromptTemplate;
    }

    const [updated] = await db
      .update(aiPromptTemplates)
      .set(updateData)
      .where(eq(aiPromptTemplates.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'AI 템플릿이 수정되었습니다',
    });
  } catch (error) {
    console.error('Error updating AI template:', error);

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
      { success: false, error: 'AI 템플릿 수정 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/templates/[id]
 * Delete an AI prompt template
 * Access: Admin only
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin permission
    await requireAdmin();

    const { id } = await params;

    // Check if template exists
    const [existing] = await db
      .select()
      .from(aiPromptTemplates)
      .where(eq(aiPromptTemplates.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'AI 템플릿을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    await db.delete(aiPromptTemplates).where(eq(aiPromptTemplates.id, id));

    return NextResponse.json({
      success: true,
      message: 'AI 템플릿이 삭제되었습니다',
    });
  } catch (error) {
    console.error('Error deleting AI template:', error);

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
      { success: false, error: 'AI 템플릿 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
