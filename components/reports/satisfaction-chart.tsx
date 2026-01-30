"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Star } from "lucide-react";

interface SatisfactionChartProps {
  data: {
    average: number;
    total: number;
    distribution: Array<{
      rating: number;
      count: number;
    }>;
  };
}

const COLORS = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#22c55e"];

export function SatisfactionChart({ data }: SatisfactionChartProps) {
  const chartData = data.distribution.map((item) => ({
    name: `${item.rating}점`,
    rating: item.rating,
    count: item.count,
  }));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>만족도 분포</CardTitle>
            <CardDescription>별점별 고객 만족도 현황</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <div className="text-right">
              <div className="text-2xl font-bold">{data.average}/5</div>
              <div className="text-xs text-muted-foreground">
                총 {data.total}개 응답
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {data.total === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            만족도 데이터가 없습니다
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="rounded-lg border bg-background p-2 shadow-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              별점
                            </span>
                            <span className="font-bold text-muted-foreground">
                              {payload[0].payload.name}
                            </span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[0.70rem] uppercase text-muted-foreground">
                              응답 수
                            </span>
                            <span className="font-bold">
                              {payload[0].value}개
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.rating - 1]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
