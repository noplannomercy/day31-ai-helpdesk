import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAgentOrAbove } from "@/lib/auth-utils";
import { userStatusUpdateSchema } from "@/lib/validations";
import { eq } from "drizzle-orm";

// PATCH /api/users/[id]/status - Update agent online/away status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await requireAgentOrAbove();
    const { id } = await params;

    const body = await request.json();

    // Validate input with Zod
    const parsed = userStatusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { isOnline, isAway } = parsed.data;

    // Only allow users to update their own status or admins to update any status
    if (currentUser.role !== "admin" && currentUser.id !== id) {
      return NextResponse.json(
        { error: "자신의 상태만 변경할 수 있습니다" },
        { status: 403 }
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

    // Only agents, managers, and admins can have online/away status
    if (!["agent", "manager", "admin"].includes(existingUser.role)) {
      return NextResponse.json(
        { error: "상담원만 온라인 상태를 변경할 수 있습니다" },
        { status: 400 }
      );
    }

    // Update status
    const updateData: { updatedAt: Date; isOnline?: boolean; isAway?: boolean } = { updatedAt: new Date() };
    if (typeof isOnline === "boolean") {
      updateData.isOnline = isOnline;
    }
    if (typeof isAway === "boolean") {
      updateData.isAway = isAway;
    }

    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning({
        id: users.id,
        isOnline: users.isOnline,
        isAway: users.isAway,
      });

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: "상태가 변경되었습니다",
    });
  } catch (error) {
    console.error("Update user status error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "상태 변경 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
