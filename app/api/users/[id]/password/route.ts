import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { passwordChangeSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

// PATCH /api/users/[id]/password - Change password
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAuth();
    const { id } = await params;

    // Only allow users to change their own password
    if (currentUser.id !== id) {
      return NextResponse.json(
        { error: "자신의 비밀번호만 변경할 수 있습니다" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate input
    const parsed = passwordChangeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    // Get user from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: "현재 비밀번호가 올바르지 않습니다" },
        { status: 400 }
      );
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await db
      .update(users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));

    return NextResponse.json({
      success: true,
      message: "비밀번호가 변경되었습니다",
    });
  } catch (error: any) {
    console.error("Password change error:", error);
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "비밀번호 변경 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
