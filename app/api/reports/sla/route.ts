import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tickets, users, categories } from "@/lib/db/schema";
import { requireManagerOrAdmin } from "@/lib/auth-utils";
import { eq, and, gte, lte, sql, isNotNull } from "drizzle-orm";

/**
 * GET /api/reports/sla
 * Get SLA performance statistics
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

    // Get overall SLA statistics
    const [overallSLA] = await db
      .select({
        totalWithResponseSLA: sql<number>`count(case when ${tickets.slaResponseMet} is not null then 1 end)::int`,
        responseMet: sql<number>`count(case when ${tickets.slaResponseMet} = true then 1 end)::int`,
        responseViolated: sql<number>`count(case when ${tickets.slaResponseMet} = false then 1 end)::int`,
        totalWithResolveSLA: sql<number>`count(case when ${tickets.slaResolveMet} is not null then 1 end)::int`,
        resolveMet: sql<number>`count(case when ${tickets.slaResolveMet} = true then 1 end)::int`,
        resolveViolated: sql<number>`count(case when ${tickets.slaResolveMet} = false then 1 end)::int`,
      })
      .from(tickets)
      .where(whereClause);

    // Calculate percentages
    const totalWithResponseSLA = Number(overallSLA.totalWithResponseSLA);
    const responseMet = Number(overallSLA.responseMet);
    const responseViolated = Number(overallSLA.responseViolated);
    const totalWithResolveSLA = Number(overallSLA.totalWithResolveSLA);
    const resolveMet = Number(overallSLA.resolveMet);
    const resolveViolated = Number(overallSLA.resolveViolated);

    const responseMetPercentage =
      totalWithResponseSLA > 0
        ? Number(((responseMet / totalWithResponseSLA) * 100).toFixed(1))
        : 0;

    const resolveMetPercentage =
      totalWithResolveSLA > 0
        ? Number(((resolveMet / totalWithResolveSLA) * 100).toFixed(1))
        : 0;

    // Get SLA performance by agent
    const slaByAgent = await db
      .select({
        agentId: tickets.agentId,
        agentName: users.name,
        totalWithResponseSLA: sql<number>`count(case when ${tickets.slaResponseMet} is not null then 1 end)::int`,
        responseMet: sql<number>`count(case when ${tickets.slaResponseMet} = true then 1 end)::int`,
        responseViolated: sql<number>`count(case when ${tickets.slaResponseMet} = false then 1 end)::int`,
        totalWithResolveSLA: sql<number>`count(case when ${tickets.slaResolveMet} is not null then 1 end)::int`,
        resolveMet: sql<number>`count(case when ${tickets.slaResolveMet} = true then 1 end)::int`,
        resolveViolated: sql<number>`count(case when ${tickets.slaResolveMet} = false then 1 end)::int`,
      })
      .from(tickets)
      .innerJoin(users, eq(tickets.agentId, users.id))
      .where(and(isNotNull(tickets.agentId), whereClause))
      .groupBy(tickets.agentId, users.name);

    // Get SLA performance by category
    const slaByCategory = await db
      .select({
        categoryId: tickets.categoryId,
        categoryName: categories.name,
        totalWithResponseSLA: sql<number>`count(case when ${tickets.slaResponseMet} is not null then 1 end)::int`,
        responseMet: sql<number>`count(case when ${tickets.slaResponseMet} = true then 1 end)::int`,
        responseViolated: sql<number>`count(case when ${tickets.slaResponseMet} = false then 1 end)::int`,
        totalWithResolveSLA: sql<number>`count(case when ${tickets.slaResolveMet} is not null then 1 end)::int`,
        resolveMet: sql<number>`count(case when ${tickets.slaResolveMet} = true then 1 end)::int`,
        resolveViolated: sql<number>`count(case when ${tickets.slaResolveMet} = false then 1 end)::int`,
      })
      .from(tickets)
      .leftJoin(categories, eq(tickets.categoryId, categories.id))
      .where(whereClause)
      .groupBy(tickets.categoryId, categories.name);

    return NextResponse.json({
      success: true,
      data: {
        overall: {
          response: {
            total: totalWithResponseSLA,
            met: responseMet,
            violated: responseViolated,
            metPercentage: responseMetPercentage,
            violatedPercentage:
              totalWithResponseSLA > 0
                ? Number(
                    ((responseViolated / totalWithResponseSLA) * 100).toFixed(1)
                  )
                : 0,
          },
          resolve: {
            total: totalWithResolveSLA,
            met: resolveMet,
            violated: resolveViolated,
            metPercentage: resolveMetPercentage,
            violatedPercentage:
              totalWithResolveSLA > 0
                ? Number(
                    ((resolveViolated / totalWithResolveSLA) * 100).toFixed(1)
                  )
                : 0,
          },
        },
        byAgent: slaByAgent.map((item) => {
          const agentResponseTotal = Number(item.totalWithResponseSLA);
          const agentResolveTotal = Number(item.totalWithResolveSLA);

          return {
            agentId: item.agentId,
            agentName: item.agentName,
            response: {
              total: agentResponseTotal,
              met: Number(item.responseMet),
              violated: Number(item.responseViolated),
              metPercentage:
                agentResponseTotal > 0
                  ? Number(
                      (
                        (Number(item.responseMet) / agentResponseTotal) *
                        100
                      ).toFixed(1)
                    )
                  : 0,
            },
            resolve: {
              total: agentResolveTotal,
              met: Number(item.resolveMet),
              violated: Number(item.resolveViolated),
              metPercentage:
                agentResolveTotal > 0
                  ? Number(
                      (
                        (Number(item.resolveMet) / agentResolveTotal) *
                        100
                      ).toFixed(1)
                    )
                  : 0,
            },
          };
        }),
        byCategory: slaByCategory.map((item) => {
          const categoryResponseTotal = Number(item.totalWithResponseSLA);
          const categoryResolveTotal = Number(item.totalWithResolveSLA);

          return {
            categoryId: item.categoryId,
            categoryName: item.categoryName || "미분류",
            response: {
              total: categoryResponseTotal,
              met: Number(item.responseMet),
              violated: Number(item.responseViolated),
              metPercentage:
                categoryResponseTotal > 0
                  ? Number(
                      (
                        (Number(item.responseMet) / categoryResponseTotal) *
                        100
                      ).toFixed(1)
                    )
                  : 0,
            },
            resolve: {
              total: categoryResolveTotal,
              met: Number(item.resolveMet),
              violated: Number(item.resolveViolated),
              metPercentage:
                categoryResolveTotal > 0
                  ? Number(
                      (
                        (Number(item.resolveMet) / categoryResolveTotal) *
                        100
                      ).toFixed(1)
                    )
                  : 0,
            },
          };
        }),
      },
    });
  } catch (error) {
    console.error("Error fetching SLA report:", error);

    if (error instanceof Error && error.message === "Forbidden") {
      return NextResponse.json(
        { success: false, error: "권한이 없습니다" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { success: false, error: "SLA 통계 조회에 실패했습니다" },
      { status: 500 }
    );
  }
}
