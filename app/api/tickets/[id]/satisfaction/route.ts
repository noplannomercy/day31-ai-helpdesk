import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customerSatisfactions, tickets } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils";
import { eq } from "drizzle-orm";
import { z } from "zod";

// Validation schema
const satisfactionSchema = z.object({
  rating: z.number().int().min(1).max(5),
  feedback: z.string().optional(),
});

/**
 * GET /api/tickets/[id]/satisfaction
 * Retrieve satisfaction rating for a ticket
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: ticketId } = await params;

    // Get the ticket
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "티켓을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Check permissions
    // Customer can view their own satisfaction
    // Agent/Manager/Admin can view any satisfaction
    const canView =
      user.role === "agent" ||
      user.role === "manager" ||
      user.role === "admin" ||
      ticket.customerId === user.id;

    if (!canView) {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다" },
        { status: 403 }
      );
    }

    // Get satisfaction rating
    const [satisfaction] = await db
      .select()
      .from(customerSatisfactions)
      .where(eq(customerSatisfactions.ticketId, ticketId))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: satisfaction || null,
    });
  } catch (error) {
    console.error("Error fetching satisfaction:", error);
    return NextResponse.json(
      { success: false, error: "만족도 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tickets/[id]/satisfaction
 * Submit customer satisfaction rating
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id: ticketId } = await params;

    // Get the ticket
    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, ticketId))
      .limit(1);

    if (!ticket) {
      return NextResponse.json(
        { success: false, error: "티켓을 찾을 수 없습니다" },
        { status: 404 }
      );
    }

    // Only the customer who created the ticket can submit satisfaction
    if (ticket.customerId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "본인이 생성한 티켓에만 만족도를 평가할 수 있습니다",
        },
        { status: 403 }
      );
    }

    // Only allow rating on Resolved or Closed tickets
    if (ticket.status !== "resolved" && ticket.status !== "closed") {
      return NextResponse.json(
        {
          success: false,
          error: "해결됨 또는 종료된 티켓만 만족도를 평가할 수 있습니다",
        },
        { status: 400 }
      );
    }

    // Check if satisfaction already exists
    const [existingSatisfaction] = await db
      .select()
      .from(customerSatisfactions)
      .where(eq(customerSatisfactions.ticketId, ticketId))
      .limit(1);

    if (existingSatisfaction) {
      return NextResponse.json(
        {
          success: false,
          error: "이미 만족도를 평가하셨습니다",
        },
        { status: 400 }
      );
    }

    // Validate request body
    const body = await request.json();
    const validatedData = satisfactionSchema.parse(body);

    // Insert satisfaction rating
    const [satisfaction] = await db
      .insert(customerSatisfactions)
      .values({
        ticketId,
        rating: validatedData.rating,
        feedback: validatedData.feedback || null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: satisfaction,
      message: "만족도 평가가 제출되었습니다",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "입력값이 올바르지 않습니다",
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error("Error submitting satisfaction:", error);
    return NextResponse.json(
      { success: false, error: "만족도 제출에 실패했습니다" },
      { status: 500 }
    );
  }
}
