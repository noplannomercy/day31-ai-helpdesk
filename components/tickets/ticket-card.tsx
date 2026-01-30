'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TicketStatusBadge } from './ticket-status-badge';
import { TicketPriorityBadge } from './ticket-priority-badge';
import { SentimentBadge, type SentimentType } from '@/components/ai';
import { MessageSquare, Paperclip, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { TicketWithRelations } from '@/lib/types';

interface TicketCardProps {
  ticket: TicketWithRelations;
}

export function TicketCard({ ticket }: TicketCardProps) {
  return (
    <Link href={`/tickets/${ticket.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="space-y-1">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg line-clamp-1">{ticket.title}</CardTitle>
            <div className="flex gap-2 flex-shrink-0 flex-wrap">
              <TicketStatusBadge status={ticket.status} />
              <TicketPriorityBadge priority={ticket.priority} />
              {ticket.sentiment && (
                <SentimentBadge sentiment={ticket.sentiment as SentimentType} />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-gray-600 line-clamp-2">{ticket.content}</p>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                <span>{ticket.customer.name}</span>
              </div>
              {ticket.category && (
                <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                  {ticket.category.name}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {ticket.commentsCount! > 0 && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{ticket.commentsCount}</span>
                </div>
              )}
              {ticket.attachmentsCount! > 0 && (
                <div className="flex items-center gap-1">
                  <Paperclip className="h-4 w-4" />
                  <span>{ticket.attachmentsCount}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>
              {formatDistanceToNow(new Date(ticket.createdAt), {
                addSuffix: true,
                locale: ko,
              })}
            </span>
            {ticket.agent && (
              <span className="flex items-center gap-1">
                담당: {ticket.agent.name}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
