/**
 * Similar Tickets Component
 *
 * Displays a list of similar tickets to help agents find relevant solutions.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SimilarTicket {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
}

interface SimilarTicketsProps {
  ticketId: string;
  limit?: number;
  className?: string;
}

const statusConfig = {
  open: { label: '대기', color: 'bg-yellow-100 text-yellow-800' },
  in_progress: { label: '진행중', color: 'bg-blue-100 text-blue-800' },
  resolved: { label: '해결', color: 'bg-green-100 text-green-800' },
  closed: { label: '종료', color: 'bg-gray-100 text-gray-800' },
};

export function SimilarTickets({
  ticketId,
  limit = 5,
  className,
}: SimilarTicketsProps) {
  const [tickets, setTickets] = useState<SimilarTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSimilarTickets() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/ai/similar?ticketId=${ticketId}&limit=${limit}`
        );

        if (!response.ok) {
          throw new Error('유사 티켓을 불러올 수 없습니다.');
        }

        const data = await response.json();
        setTickets(data.data || []);

      } catch (err) {
        console.error('Failed to fetch similar tickets:', err);
        setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    if (ticketId) {
      fetchSimilarTickets();
    }
  }, [ticketId, limit]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            유사 티켓
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            유사 티켓
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            유사 티켓
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            유사한 티켓을 찾을 수 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          유사 티켓 ({tickets.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tickets.map((ticket) => {
          const status = statusConfig[ticket.status as keyof typeof statusConfig] ||
                        statusConfig.open;

          return (
            <Link
              key={ticket.id}
              href={`/tickets/${ticket.id}`}
              className="block p-3 rounded-lg border hover:bg-accent transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium line-clamp-2 flex-1">
                    {ticket.title}
                  </p>
                  {ticket.resolvedAt && (
                    <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge
                    variant="outline"
                    className={cn('text-xs', status.color)}
                  >
                    {status.label}
                  </Badge>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(ticket.createdAt).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
