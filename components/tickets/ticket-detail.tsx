'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TicketStatusBadge } from './ticket-status-badge';
import { TicketPriorityBadge } from './ticket-priority-badge';
import { TicketComments } from './ticket-comments';
import { TicketAttachments } from './ticket-attachments';
import { TicketHistory } from './ticket-history';
import { AIResponsePanel, SentimentBadge, SimilarTickets, type SentimentType } from '@/components/ai';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { User, Calendar, RotateCcw } from 'lucide-react';
import type { TicketWithRelations } from '@/lib/types';
// Reopen check moved to server-side

interface TicketDetailProps {
  ticket: TicketWithRelations;
  userRole: string;
  canReopenTicket: boolean;
}

export function TicketDetail({ ticket: initialTicket, userRole, canReopenTicket: canReopen }: TicketDetailProps) {
  const router = useRouter();
  const [ticket, setTicket] = useState(initialTicket);
  const [isUpdating, setIsUpdating] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');

  const canChangeStatus = ['agent', 'manager', 'admin'].includes(userRole);
  const isAgent = ['agent', 'manager', 'admin'].includes(userRole);

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/tickets/${ticket.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '상태 변경에 실패했습니다');
      }

      toast.success('티켓 상태가 변경되었습니다');
      router.refresh();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(
        error instanceof Error ? error.message : '상태 변경 중 오류가 발생했습니다'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReopen = async () => {
    if (!confirm('이 티켓을 재오픈하시겠습니까?')) return;

    setIsUpdating(true);

    try {
      const response = await fetch(`/api/tickets/${ticket.id}/reopen`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '재오픈에 실패했습니다');
      }

      toast.success('티켓이 재오픈되었습니다');
      router.refresh();
    } catch (error) {
      console.error('Error reopening ticket:', error);
      toast.error(
        error instanceof Error ? error.message : '재오픈 중 오류가 발생했습니다'
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Content */}
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <TicketStatusBadge status={ticket.status} />
                  <TicketPriorityBadge priority={ticket.priority} />
                  {ticket.category && (
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      {ticket.category.name}
                    </span>
                  )}
                  {ticket.sentiment && (
                    <SentimentBadge sentiment={ticket.sentiment as SentimentType} />
                  )}
                </div>
                <CardTitle className="text-2xl">{ticket.title}</CardTitle>
              </div>

              <div className="flex gap-2">
                {canReopen && (
                  <Button
                    variant="outline"
                    onClick={handleReopen}
                    disabled={isUpdating}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    재오픈
                  </Button>
                )}
                {canChangeStatus && (
                  <Select
                    value={ticket.status}
                    onValueChange={handleStatusChange}
                    disabled={isUpdating}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">열림</SelectItem>
                      <SelectItem value="in_progress">진행중</SelectItem>
                      <SelectItem value="resolved">해결됨</SelectItem>
                      <SelectItem value="closed">닫힘</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </CardHeader>

          <Separator />

          <CardContent className="pt-6 space-y-6">
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap">{ticket.content}</p>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <User className="h-4 w-4" />
                <span>고객: {ticket.customer.name}</span>
              </div>
              {ticket.agent && (
                <div className="flex items-center gap-2 text-gray-600">
                  <User className="h-4 w-4" />
                  <span>담당자: {ticket.agent.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="h-4 w-4" />
                <span>
                  생성:{' '}
                  {formatDistanceToNow(new Date(ticket.createdAt), {
                    addSuffix: true,
                    locale: ko,
                  })}
                </span>
              </div>
              {ticket.resolvedAt && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>
                    해결:{' '}
                    {formatDistanceToNow(new Date(ticket.resolvedAt), {
                      addSuffix: true,
                      locale: ko,
                    })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="comments" className="space-y-6">
          <TabsList>
            <TabsTrigger value="comments">댓글</TabsTrigger>
            <TabsTrigger value="attachments">첨부파일</TabsTrigger>
            <TabsTrigger value="history">이력</TabsTrigger>
          </TabsList>

          <TabsContent value="comments" className="space-y-4">
            <TicketComments ticketId={ticket.id} userRole={userRole} />
          </TabsContent>

          <TabsContent value="attachments" className="space-y-4">
            <TicketAttachments
              ticketId={ticket.id}
              canDelete={userRole !== 'customer'}
            />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <TicketHistory ticketId={ticket.id} />
          </TabsContent>
        </Tabs>

        {/* AI Response Panel for Agents */}
        {isAgent && (
          <AIResponsePanel
            ticketId={ticket.id}
            onResponseAccepted={(response) => {
              // Store the AI response in state to be used in comments
              setCommentDraft(response);
              // Show toast to guide user
              toast.success('AI 답변이 준비되었습니다. 댓글 탭에서 확인 후 게시하세요.');
              // TODO: Could scroll to comments section or switch to comments tab
            }}
          />
        )}
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1 space-y-6">
        {/* Similar Tickets - visible to agents */}
        {isAgent && <SimilarTickets ticketId={ticket.id} />}
      </div>
    </div>
  );
}
