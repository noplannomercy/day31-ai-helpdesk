import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tickets, users, categories } from "@/lib/db/schema";
import { requireManagerOrAdmin } from "@/lib/auth-utils";
import { eq, and, gte, lte, sql, isNotNull } from "drizzle-orm";

/**
 * GET /api/reports/overview
 * Get overall ticket statistics
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
      dateFilter.push(gte(tickets.createdAt, new Date(startDate)));
    }
    if (endDate) {
      // Include the entire end date
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      dateFilter.push(lte(tickets.createdAt, endDateTime));
    }

    const whereClause = dateFilter.length > 0 ? and(...dateFilter) : undefined;

    // Get ticket counts by status
    const statusCounts = await db
      .select({
        status: tickets.status,
        count: sql<number>`count(*)::int`,
      })
      .from(tickets)
      .where(whereClause)
      .groupBy(tickets.status);

    // Get ticket counts by priority
    const priorityCounts = await db
      .select({
        priority: tickets.priority,
        count: sql<number>`count(*)::int`,
      })
      .from(tickets)
      .where(whereClause)
      .groupBy(tickets.priority);

    // Get ticket counts by category
    const categoryCounts = await db
      .select({
        categoryId: tickets.categoryId,
        categoryName: categories.name,
        count: sql<number>`count(*)::int`,
      })
      .from(tickets)
      .leftJoin(categories, eq(tickets.categoryId, categories.id))
      .where(whereClause)
      .groupBy(tickets.categoryId, categories.name);

    // Get agent performance
    const agentPerformance = await db
      .select({
        agentId: tickets.agentId,
        agentName: users.name,
        totalAssigned: sql<number>`count(*)::int`,
        resolved: sql<number>`count(case when ${tickets.status} = 'resolved' or ${tickets.status} = 'closed' then 1 end)::int`,
        avgResolutionTime: sql<number>`
          avg(
            case
              when ${tickets.resolvedAt} is not null
              then extract(epoch from (${tickets.resolvedAt} - ${tickets.createdAt})) / 3600
            end
          )
        `,
      })
      .from(tickets)
      .innerJoin(users, eq(tickets.agentId, users.id))
      .where(and(isNotNull(tickets.agentId), whereClause))
      .groupBy(tickets.agentId, users.name);

    // Calculate total tickets
    const totalTickets = statusCounts.reduce(
      (sum, item) => sum + Number(item.count),
      0
    );

    // Format response
    const statusMap = statusCounts.reduce(
      (acc, item) => {
        acc[item.status] = Number(item.count);
        return acc;
      },
      {} as Record<string, number>
    );

    const priorityMap = priorityCounts.reduce(
      (acc, item) => {
        acc[item.priority] = Number(item.count);
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      success: true,
      data: {
        total: totalTickets,
        byStatus: {
          open: statusMap.open || 0,
          in_progress: statusMap.in_progress || 0,
          resolved: statusMap.resolved || 0,
          closed: statusMap.closed || 0,
        },
        byPriority: {
          low: priorityMap.low || 0,
          medium: priorityMap.medium || 0,
          high: priorityMap.high || 0,
        },
        byCategory: categoryCounts.map((item) => ({
          categoryId: item.categoryId,
          categoryName: item.categoryName || "미분류",
          count: Number(item.count),
        })),
        agentPerformance: agentPerformance.map((item) => ({
          agentId: item.agentId,
          agentName: item.agentName,
          totalAssigned: Number(item.totalAssigned),
          resolved: Number(item.resolved),
          avgResolutionTime: item.avgResolutionTime
            ? Number(item.avgResolutionTime.toFixed(2))
            : 0,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching overview report:", error);

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: "통계 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}
