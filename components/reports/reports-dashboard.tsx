"use client";

import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "./date-range-picker";
import { StatsOverview } from "./stats-overview";
import { SatisfactionChart } from "./satisfaction-chart";
import { TicketChart } from "./ticket-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface OverviewData {
  total: number;
  byStatus: {
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
  };
  byPriority: {
    low: number;
    medium: number;
    high: number;
  };
  byCategory: Array<{
    categoryId: string | null;
    categoryName: string;
    count: number;
  }>;
  agentPerformance: Array<{
    agentId: string;
    agentName: string;
    totalAssigned: number;
    resolved: number;
    avgResolutionTime: number;
  }>;
}

interface SatisfactionData {
  average: number;
  total: number;
  distribution: Array<{
    rating: number;
    count: number;
  }>;
  byCategory: Array<{
    categoryId: string | null;
    categoryName: string;
    average: number;
    count: number;
  }>;
  byAgent: Array<{
    agentId: string;
    agentName: string;
    average: number;
    count: number;
  }>;
}

interface SLAData {
  overall: {
    response: {
      total: number;
      met: number;
      violated: number;
      metPercentage: number;
      violatedPercentage: number;
    };
    resolve: {
      total: number;
      met: number;
      violated: number;
      metPercentage: number;
      violatedPercentage: number;
    };
  };
  byAgent: Array<{
    agentId: string;
    agentName: string;
    response: {
      total: number;
      met: number;
      violated: number;
      metPercentage: number;
    };
    resolve: {
      total: number;
      met: number;
      violated: number;
      metPercentage: number;
    };
  }>;
  byCategory: Array<{
    categoryId: string | null;
    categoryName: string;
    response: {
      total: number;
      met: number;
      violated: number;
      metPercentage: number;
    };
    resolve: {
      total: number;
      met: number;
      violated: number;
      metPercentage: number;
    };
  }>;
}

export function ReportsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [satisfactionData, setSatisfactionData] =
    useState<SatisfactionData | null>(null);
  const [slaData, setSLAData] = useState<SLAData | null>(null);

  useEffect(() => {
    fetchReports();
  }, [dateRange]);

  const fetchReports = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        startDate: format(dateRange.from, "yyyy-MM-dd"),
        endDate: format(dateRange.to, "yyyy-MM-dd"),
      });

      const [overviewRes, satisfactionRes, slaRes] = await Promise.all([
        fetch(`/api/reports/overview?${params}`),
        fetch(`/api/reports/satisfaction?${params}`),
        fetch(`/api/reports/sla?${params}`),
      ]);

      if (!overviewRes.ok || !satisfactionRes.ok || !slaRes.ok) {
        throw new Error("보고서 데이터를 불러오는데 실패했습니다");
      }

      const [overview, satisfaction, sla] = await Promise.all([
        overviewRes.json(),
        satisfactionRes.json(),
        slaRes.json(),
      ]);

      setOverviewData(overview.data);
      setSatisfactionData(satisfaction.data);
      setSLAData(sla.data);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError(
        err instanceof Error ? err.message : "보고서를 불러오는데 실패했습니다"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Picker */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">보고서</h2>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* Stats Overview */}
      {overviewData && satisfactionData && slaData && (
        <StatsOverview
          totalTickets={overviewData.total}
          avgSatisfaction={satisfactionData.average}
          slaResponsePercentage={slaData.overall.response.metPercentage}
          slaResolvePercentage={slaData.overall.resolve.metPercentage}
        />
      )}

      {/* Ticket Charts */}
      {overviewData && (
        <TicketChart
          byStatus={overviewData.byStatus}
          byPriority={overviewData.byPriority}
          byCategory={overviewData.byCategory}
        />
      )}

      {/* Satisfaction Chart */}
      {satisfactionData && <SatisfactionChart data={satisfactionData} />}

      {/* Agent Performance */}
      {overviewData && overviewData.agentPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>담당자별 성과</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {overviewData.agentPerformance.map((agent) => (
                <div
                  key={agent.agentId}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div>
                    <div className="font-medium">{agent.agentName}</div>
                    <div className="text-sm text-muted-foreground">
                      총 {agent.totalAssigned}건 할당 / {agent.resolved}건 해결
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      평균 해결 시간
                    </div>
                    <div className="text-lg font-bold">
                      {agent.avgResolutionTime.toFixed(1)}시간
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SLA Performance */}
      {slaData && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>응답 SLA 성과</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">달성</span>
                  <span className="font-medium">
                    {slaData.overall.response.met}건 (
                    {slaData.overall.response.metPercentage}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">위반</span>
                  <span className="font-medium">
                    {slaData.overall.response.violated}건 (
                    {slaData.overall.response.violatedPercentage}%)
                  </span>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-sm font-medium">총</span>
                  <span className="font-bold">
                    {slaData.overall.response.total}건
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>해결 SLA 성과</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">달성</span>
                  <span className="font-medium">
                    {slaData.overall.resolve.met}건 (
                    {slaData.overall.resolve.metPercentage}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">위반</span>
                  <span className="font-medium">
                    {slaData.overall.resolve.violated}건 (
                    {slaData.overall.resolve.violatedPercentage}%)
                  </span>
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-sm font-medium">총</span>
                  <span className="font-bold">
                    {slaData.overall.resolve.total}건
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
