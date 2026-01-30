"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Ticket, TrendingUp, Star, Clock } from "lucide-react";

interface StatsOverviewProps {
  totalTickets: number;
  avgSatisfaction: number;
  slaResponsePercentage: number;
  slaResolvePercentage: number;
}

export function StatsOverview({
  totalTickets,
  avgSatisfaction,
  slaResponsePercentage,
  slaResolvePercentage,
}: StatsOverviewProps) {
  const stats = [
    {
      title: "총 티켓 수",
      value: totalTickets.toLocaleString(),
      description: "기간 내 생성된 티켓",
      icon: Ticket,
      color: "text-blue-600",
    },
    {
      title: "평균 만족도",
      value: avgSatisfaction > 0 ? `${avgSatisfaction}/5` : "N/A",
      description: "고객 만족도 평균",
      icon: Star,
      color: "text-yellow-600",
    },
    {
      title: "응답 SLA 달성률",
      value: slaResponsePercentage > 0 ? `${slaResponsePercentage}%` : "N/A",
      description: "1시간 내 응답 목표",
      icon: TrendingUp,
      color: slaResponsePercentage >= 80 ? "text-green-600" : "text-red-600",
    },
    {
      title: "해결 SLA 달성률",
      value: slaResolvePercentage > 0 ? `${slaResolvePercentage}%` : "N/A",
      description: "24시간 내 해결 목표",
      icon: Clock,
      color: slaResolvePercentage >= 80 ? "text-green-600" : "text-red-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon className={cn("h-4 w-4", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
