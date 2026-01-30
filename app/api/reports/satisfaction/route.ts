import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { customerSatisfactions, tickets, users, categories } from "@/lib/db/schema";
import { requireManagerOrAdmin } from "@/lib/auth-utils";
import { eq, and, gte, lte, sql } from "drizzle-orm";

/**
 * GET /api/reports/satisfaction
 * Get satisfaction statistics
 * Query params: startDate, endDate (YYYY-MM-DD format)
 */
export async function GET(request: NextRequest) {
  try {
    await requireManagerOrAdmin();

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Build date filter
    const dateFilter = [];
    if (startDate) {
      dateFilter.push(gte(customerSatisfactions.createdAt, new Date(startDate)));
    }
    if (endDate) {
      // Include the entire end date
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      dateFilter.push(lte(customerSatisfactions.createdAt, endDateTime));
    }

    const whereClause = dateFilter.length > 0 ? and(...dateFilter) : undefined;

    // Get average satisfaction score
    const [averageResult] = await db
      .select({
        average: sql<number>`avg(${customerSatisfactions.rating})`,
        total: sql<number>`count(*)::int`,
      })
      .from(customerSatisfactions)
      .where(whereClause);

    // Get rating distribution (1-5 stars)
    const ratingDistribution = await db
      .select({
        rating: customerSatisfactions.rating,
        count: sql<number>`count(*)::int`,
      })
      .from(customerSatisfactions)
      .where(whereClause)
      .groupBy(customerSatisfactions.rating)
      .orderBy(customerSatisfactions.rating);

    // Get satisfaction by category
    const satisfactionByCategory = await db
      .select({
        categoryId: tickets.categoryId,
        categoryName: categories.name,
        average: sql<number>`avg(${customerSatisfactions.rating})`,
        count: sql<number>`count(*)::int`,
      })
      .from(customerSatisfactions)
      .innerJoin(tickets, eq(customerSatisfactions.ticketId, tickets.id))
      .leftJoin(categories, eq(tickets.categoryId, categories.id))
      .where(whereClause)
      .groupBy(tickets.categoryId, categories.name);

    // Get satisfaction by agent
    const satisfactionByAgent = await db
      .select({
        agentId: tickets.agentId,
        agentName: users.name,
        average: sql<number>`avg(${customerSatisfactions.rating})`,
        count: sql<number>`count(*)::int`,
      })
      .from(customerSatisfactions)
      .innerJoin(tickets, eq(customerSatisfactions.ticketId, tickets.id))
      .innerJoin(users, eq(tickets.agentId, users.id))
      .where(whereClause)
      .groupBy(tickets.agentId, users.name);

    // Format rating distribution to include all 1-5 ratings
    const ratingMap = ratingDistribution.reduce(
      (acc, item) => {
        acc[item.rating] = Number(item.count);
        return acc;
      },
      {} as Record<number, number>
    );

    const distribution = [1, 2, 3, 4, 5].map((rating) => ({
      rating,
      count: ratingMap[rating] || 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        average: averageResult.average
          ? Number(averageResult.average.toFixed(1))
          : 0,
        total: Number(averageResult.total),
        distribution,
        byCategory: satisfactionByCategory.map((item) => ({
          categoryId: item.categoryId,
          categoryName: item.categoryName || "미분류",
          average: item.average ? Number(item.average.toFixed(1)) : 0,
          count: Number(item.count),
        })),
        byAgent: satisfactionByAgent.map((item) => ({
          agentId: item.agentId,
          agentName: item.agentName,
          average: item.average ? Number(item.average.toFixed(1)) : 0,
          count: Number(item.count),
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching satisfaction report:", error);

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: "만족도 통계 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}
