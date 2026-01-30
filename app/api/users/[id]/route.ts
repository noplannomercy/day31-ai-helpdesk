import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-utils";
import { userUpdateSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

// GET /api/users/[id] - Get user details (Admin only)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isOnline: users.isOnline,
        isAway: users.isAway,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Get user error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "사용자 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// PATCH /api/users/[id] - Update user (Admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json();

    // Validate input
    const parsed = userUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existingUser) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set({
        ...parsed.data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isOnline: users.isOnline,
        isAway: users.isAway,
        updatedAt: users.updatedAt,
      });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: "사용자 정보가 수정되었습니다",
    });
  } catch (error) {
    console.error("Update user error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "사용자 수정 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user (Admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!existingUser) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Delete user
    await db.delete(users).where(eq(users.id, id));

    return NextResponse.json({
      success: true,
      message: "사용자가 삭제되었습니다",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "사용자 삭제 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
