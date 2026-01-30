import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { knowledgeBases, categories } from '@/lib/db/schema';
import { knowledgeBaseCreateSchema } from '@/lib/validations';
import { requireManagerOrAdmin } from '@/lib/auth-utils';
import { eq, desc, and, or, ilike } from 'drizzle-orm';

/**
 * GET /api/knowledge-base
 * Get all knowledge bases with optional filtering
 * Access: Manager, Admin (Read), Agents (Read only active)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const isActive = searchParams.get('isActive');
    const search = searchParams.get('search');

    let query = db
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
      .$dynamic();

    // Build filter conditions
    const conditions = [];

    if (categoryId) {
      conditions.push(eq(knowledgeBases.categoryId, categoryId));
    }

    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(knowledgeBases.isActive, isActive === 'true'));
    }

    if (search) {
      conditions.push(
        or(
          ilike(knowledgeBases.title, `%${search}%`),
          ilike(knowledgeBases.content, `%${search}%`)
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const allKnowledgeBases = await query.orderBy(desc(knowledgeBases.updatedAt));

    return NextResponse.json({
      success: true,
      data: allKnowledgeBases,
    });
  } catch (error) {
    console.error('Error fetching knowledge bases:', error);
    return NextResponse.json(
      { success: false, error: '지식베이스 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/knowledge-base
 * Create a new knowledge base entry
 * Access: Manager, Admin only
 */
export async function POST(request: NextRequest) {
  try {
    // Check manager or admin permission
    await requireManagerOrAdmin();

    const body = await request.json();
    const validated = knowledgeBaseCreateSchema.parse(body);

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

    const [newKnowledgeBase] = await db
      .insert(knowledgeBases)
      .values({
        title: validated.title,
        content: validated.content,
        categoryId: validated.categoryId || null,
        isActive: validated.isActive,
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newKnowledgeBase,
        message: '지식베이스가 생성되었습니다',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating knowledge base:', error);

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
      { success: false, error: '지식베이스 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
