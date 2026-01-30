import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { aiPromptTemplates, categories } from '@/lib/db/schema';
import { aiTemplateCreateSchema } from '@/lib/validations';
import { requireAdmin } from '@/lib/auth-utils';
import { eq, desc, isNull } from 'drizzle-orm';

/**
 * GET /api/templates
 * Get all AI prompt templates
 * Access: Admin only
 */
export async function GET() {
  try {
    // Check admin permission
    await requireAdmin();

    const allTemplates = await db
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
      .orderBy(desc(aiPromptTemplates.updatedAt));

    return NextResponse.json({
      success: true,
      data: allTemplates,
    });
  } catch (error) {
    console.error('Error fetching AI templates:', error);

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
 * POST /api/templates
 * Create a new AI prompt template
 * Access: Admin only
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin permission
    await requireAdmin();

    const body = await request.json();
    const validated = aiTemplateCreateSchema.parse(body);

    // Verify category exists
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

    // Check if template already exists for this category
    const [existingTemplate] = await db
      .select()
      .from(aiPromptTemplates)
      .where(eq(aiPromptTemplates.categoryId, validated.categoryId))
      .limit(1);

    if (existingTemplate) {
      return NextResponse.json(
        { success: false, error: '이 카테고리에 이미 템플릿이 존재합니다. 기존 템플릿을 수정해주세요.' },
        { status: 400 }
      );
    }

    const [newTemplate] = await db
      .insert(aiPromptTemplates)
      .values({
        categoryId: validated.categoryId,
        systemPrompt: validated.systemPrompt,
        userPromptTemplate: validated.userPromptTemplate,
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newTemplate,
        message: 'AI 템플릿이 생성되었습니다',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating AI template:', error);

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
      { success: false, error: 'AI 템플릿 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
