'use client';

import { useState, useEffect, useCallback } from 'react';
import { TicketCard } from './ticket-card';
import { TicketFilters } from './ticket-filters';
import { Pagination } from '@/components/common/pagination';
import { EmptyState } from '@/components/common/empty-state';
import { Loading } from '@/components/common/loading';
import { toast } from 'sonner';
import type { TicketWithRelations, TicketFilters as Filters } from '@/lib/types';

export function TicketList() {
  const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<Filters>({});

  const loadTickets = useCallback(async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '10',
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.priority ? { priority: filters.priority } : {}),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
        ...(filters.search ? { search: filters.search } : {}),
      });

      const response = await fetch(`/api/tickets?${params}`);
      const result = await response.json();

      if (result.success) {
        setTickets(result.data);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
      toast.error('티켓 목록을 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleFilterChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-muted animate-pulse rounded" />
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="border rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-2 flex-1">
                  <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                </div>
                <div className="h-6 w-20 bg-muted animate-pulse rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
                <div className="h-4 w-5/6 bg-muted animate-pulse rounded" />
              </div>
              <div className="flex gap-2 mt-4">
                <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                <div className="h-5 w-16 bg-muted animate-pulse rounded" />
                <div className="h-5 w-24 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TicketFilters onFilterChange={handleFilterChange} />

      {tickets.length === 0 ? (
        <EmptyState
          title="티켓이 없습니다"
          description="아직 생성된 티켓이 없습니다. 새 티켓을 생성하여 고객 문의를 관리하세요."
          action={{
            label: "새 티켓 생성",
            onClick: () => window.location.href = '/tickets/new'
          }}
        />
      ) : (
        <>
          <div className="grid gap-4">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>

          {totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              pageSize={10}
              totalItems={total}
              onPageChange={setPage}
            />
          )}
        </>
      )}
    </div>
  );
}
