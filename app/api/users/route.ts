import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth-utils";
import { userCreateSchema } from "@/lib/validations";
import { eq, or, ilike, sql, and } from "drizzle-orm";

// GET /api/users - List all users (Admin only)
export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const role = searchParams.get("role");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");

    // Build where conditions
    const conditions = [];
    if (search) {
      conditions.push(
        or(
          ilike(users.name, `%${search}%`),
          ilike(users.email, `%${search}%`)
        )
      );
    }
    if (role && ['customer', 'agent', 'manager', 'admin'].includes(role)) {
      conditions.push(eq(users.role, role as 'customer' | 'agent' | 'manager' | 'admin'));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .$dynamic()
      .where(whereClause);
    const total = Number(totalResult[0]?.count || 0);

    // Get paginated data
    const userList = await db
      .select()
      .from(users)
      .$dynamic()
      .where(whereClause)
      .orderBy(users.createdAt)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    // Remove password hashes from response
    const sanitizedUsers = userList.map(({ passwordHash, ...user }) => user);

    return NextResponse.json({
      success: true,
      data: sanitizedUsers,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    if (error instanceof Error && error.message === "Unauthorized") {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "사용자 목록 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user (Admin only)
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();

    // Validate input
    const parsed = userCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password, name, role } = parsed.data;

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      return NextResponse.json(
        { error: "이미 등록된 이메일입니다" },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        name,
        role,
      })
      .returning({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isOnline: users.isOnline,
        isAway: users.isAway,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      });

    return NextResponse.json(
      {
        success: true,
        data: newUser,
        message: "사용자가 생성되었습니다",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Create user error:", error);
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "인증이 필요합니다" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json({ error: "권한이 없습니다" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "사용자 생성 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}
