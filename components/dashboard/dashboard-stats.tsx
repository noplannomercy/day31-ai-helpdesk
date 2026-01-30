'use client';

import { useState, useEffect, useCallback } from 'react';
import { StatCard } from './stat-card';
import { Ticket, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { DashboardStats } from '@/lib/types';

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    resolvedTickets: 0,
    closedTickets: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = useCallback(async () => {
      try {
        // Simplified - get counts from ticket list API
        const response = await fetch('/api/tickets?pageSize=1000');
        const result = await response.json();

        if (result.success) {
          const tickets = result.data as Array<{ status: string }>;
          const newStats: DashboardStats = {
            totalTickets: tickets.length,
            openTickets: tickets.filter((t) => t.status === 'open').length,
            inProgressTickets: tickets.filter((t) => t.status === 'in_progress').length,
            resolvedTickets: tickets.filter((t) => t.status === 'resolved').length,
            closedTickets: tickets.filter((t) => t.status === 'closed').length,
          };
          setStats(newStats);
        }
      } catch (error) {
        console.error('Error loading stats:', error);
        toast.error('통계를 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between space-x-4">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
                <div className="h-3 w-24 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-12 w-12 bg-muted animate-pulse rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="총 티켓"
        value={stats.totalTickets}
        icon={Ticket}
        description="전체 티켓 수"
      />
      <StatCard
        title="진행 중"
        value={stats.openTickets + stats.inProgressTickets}
        icon={Clock}
        description="열림 + 진행중"
      />
      <StatCard
        title="해결됨"
        value={stats.resolvedTickets}
        icon={CheckCircle}
        description="해결된 티켓"
      />
      <StatCard
        title="종료됨"
        value={stats.closedTickets}
        icon={XCircle}
        description="종료된 티켓"
      />
    </div>
  );
}
