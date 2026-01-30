'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TicketStatusBadge } from '@/components/tickets/ticket-status-badge';
import { ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { toast } from 'sonner';
import type { TicketWithRelations } from '@/lib/types';

export function RecentTickets() {
  const [tickets, setTickets] = useState<TicketWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTickets = async () => {
      try {
        const response = await fetch('/api/tickets?pageSize=5');
        const result = await response.json();

        if (result.success) {
          setTickets(result.data);
        }
      } catch (error) {
        console.error('Error loading tickets:', error);
        toast.error('티켓을 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };

    loadTickets();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>최근 티켓</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">로딩 중...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>최근 티켓</CardTitle>
        <Link href="/tickets">
          <Button variant="ghost" size="sm">
            모두 보기
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <p className="text-gray-500 text-center py-8">아직 티켓이 없습니다</p>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="block hover:bg-gray-50 p-3 rounded-lg transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <TicketStatusBadge status={ticket.status} />
                      {ticket.category && (
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                          {ticket.category.name}
                        </span>
                      )}
                    </div>
                    <p className="font-medium truncate">{ticket.title}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {ticket.customer.name}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatDistanceToNow(new Date(ticket.createdAt), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
