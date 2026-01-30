'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';

interface HistoryEntry {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: {
    name: string;
  };
}

interface TicketHistoryProps {
  ticketId: string;
}

export function TicketHistory({ ticketId }: TicketHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simplified - in production, create proper API endpoint
    setIsLoading(false);
    setHistory([]);
  }, [ticketId]);

  const fieldLabels: Record<string, string> = {
    status: '상태',
    priority: '우선순위',
    agent: '담당자',
    category: '카테고리',
    title: '제목',
    content: '내용',
  };

  if (isLoading) {
    return <div className="text-sm text-gray-500">로딩 중...</div>;
  }

  if (history.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-gray-500">
          이력이 없습니다
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Clock className="h-5 w-5" />
        변경 이력
      </h3>

      <div className="space-y-3">
        {history.map((entry) => (
          <Card key={entry.id}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">{entry.user.name}</span>님이{' '}
                    <span className="font-medium">{fieldLabels[entry.field] || entry.field}</span>을(를) 변경했습니다
                  </p>
                  <div className="text-sm text-gray-600">
                    {entry.oldValue && (
                      <span className="line-through">{entry.oldValue}</span>
                    )}
                    {entry.oldValue && entry.newValue && ' → '}
                    {entry.newValue && (
                      <span className="font-medium">{entry.newValue}</span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(entry.createdAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
