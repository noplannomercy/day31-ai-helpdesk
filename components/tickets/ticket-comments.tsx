'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { commentCreateSchema, type CommentCreateInput } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Lock } from 'lucide-react';
import type { CommentWithAuthor } from '@/lib/types';

interface TicketCommentsProps {
  ticketId: string;
  userRole: string;
}

export function TicketComments({ ticketId, userRole }: TicketCommentsProps) {
  const [comments, setComments] = useState<CommentWithAuthor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(commentCreateSchema),
    defaultValues: {
      content: '',
      isInternal: false,
    },
  });

  const isInternal = watch('isInternal');
  const canCreateInternalNotes = ['agent', 'manager', 'admin'].includes(userRole);

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/tickets/${ticketId}/comments`);
      const result = await response.json();

      if (result.success) {
        setComments(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('댓글을 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const onSubmit = async (data: CommentCreateInput) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '댓글 추가에 실패했습니다');
      }

      toast.success('댓글이 추가되었습니다');
      reset();
      loadComments();
    } catch (error) {
      console.error('Error creating comment:', error);
      toast.error(
        error instanceof Error ? error.message : '댓글 추가 중 오류가 발생했습니다'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">댓글 ({comments.length})</h3>

        {comments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              아직 댓글이 없습니다
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <Card
                key={comment.id}
                className={comment.isInternal ? 'border-yellow-300 bg-yellow-50' : ''}
              >
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <Avatar>
                      <AvatarFallback>
                        {comment.author.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{comment.author.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {comment.author.role === 'customer' && '고객'}
                            {comment.author.role === 'agent' && '상담원'}
                            {comment.author.role === 'manager' && '관리자'}
                            {comment.author.role === 'admin' && '관리자'}
                          </Badge>
                          {comment.isInternal && (
                            <Badge variant="secondary" className="text-xs">
                              <Lock className="h-3 w-3 mr-1" />
                              내부 노트
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(comment.createdAt), {
                            addSuffix: true,
                            locale: ko,
                          })}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="comment">댓글 작성</Label>
              <Textarea
                id="comment"
                {...register('content')}
                placeholder="댓글을 입력하세요..."
                rows={4}
                disabled={isSubmitting}
              />
              {errors.content && (
                <p className="text-sm text-red-500">{errors.content.message}</p>
              )}
            </div>

            {canCreateInternalNotes && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="isInternal"
                  checked={isInternal}
                  onCheckedChange={(checked) => setValue('isInternal', checked)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="isInternal" className="cursor-pointer">
                  <Lock className="h-4 w-4 inline mr-1" />
                  내부 노트 (고객에게 보이지 않음)
                </Label>
              </div>
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '추가 중...' : '댓글 추가'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
