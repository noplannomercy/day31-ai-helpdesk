import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { categoryUpdateSchema } from '@/lib/validations';
import { requireAdmin } from '@/lib/auth-utils';
import { eq } from 'drizzle-orm';

/**
 * GET /api/categories/[id]
 * Get a single category by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!category) {
      return NextResponse.json(
        { success: false, error: '카테고리를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { success: false, error: '카테고리 조회 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/categories/[id]
 * Update a category (Admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check admin permission
    await requireAdmin();

    const body = await request.json();
    const validated = categoryUpdateSchema.parse(body);

    // Check if category exists
    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '카테고리를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // Check for duplicate name if name is being changed
    if (validated.name && validated.name !== existing.name) {
      const [duplicate] = await db
        .select()
        .from(categories)
        .where(eq(categories.name, validated.name))
        .limit(1);

      if (duplicate) {
        return NextResponse.json(
          { success: false, error: '이미 존재하는 카테고리명입니다' },
          { status: 400 }
        );
      }
    }

    const [updated] = await db
      .update(categories)
      .set({
        ...validated,
        updatedAt: new Date(),
      })
      .where(eq(categories.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updated,
      message: '카테고리가 수정되었습니다',
    });
  } catch (error) {
    console.error('Error updating category:', error);

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
      { success: false, error: '카테고리 수정 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories/[id]
 * Delete a category (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check admin permission
    await requireAdmin();

    // Check if category exists
    const [existing] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '카테고리를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    await db.delete(categories).where(eq(categories.id, id));

    return NextResponse.json({
      success: true,
      message: '카테고리가 삭제되었습니다',
    });
  } catch (error) {
    console.error('Error deleting category:', error);

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
      { success: false, error: '카테고리 삭제 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
