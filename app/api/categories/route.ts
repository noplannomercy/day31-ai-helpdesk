import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { categoryCreateSchema } from '@/lib/validations';
import { requireAdmin } from '@/lib/auth-utils';
import { desc, eq } from 'drizzle-orm';

/**
 * GET /api/categories
 * Get all categories (ordered by sort_order)
 */
export async function GET() {
  try {
    const allCategories = await db
      .select()
      .from(categories)
      .orderBy(categories.sortOrder, categories.name);

    return NextResponse.json({
      success: true,
      data: allCategories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { success: false, error: '카테고리 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * Create a new category (Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin permission
    await requireAdmin();

    const body = await request.json();
    const validated = categoryCreateSchema.parse(body);

    // Check for duplicate name
    const existing = await db
      .select()
      .from(categories)
      .where(eq(categories.name, validated.name))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: '이미 존재하는 카테고리명입니다' },
        { status: 400 }
      );
    }

    const [newCategory] = await db
      .insert(categories)
      .values({
        name: validated.name,
        sortOrder: validated.sortOrder,
        isActive: validated.isActive,
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newCategory,
        message: '카테고리가 생성되었습니다',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating category:', error);

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
      { success: false, error: '카테고리 생성 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
