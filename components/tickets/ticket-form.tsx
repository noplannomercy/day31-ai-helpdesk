'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ticketCreateSchema, type TicketCreateInput } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CategorySuggestion } from '@/components/ai';
import { toast } from 'sonner';
import type { Category } from '@/lib/db/schema';

export function TicketForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(ticketCreateSchema),
    defaultValues: {
      priority: 'medium' as const,
    },
  });

  const priority = watch('priority');
  const categoryId = watch('categoryId');
  const title = watch('title');
  const content = watch('content');

  useEffect(() => {
    // Load active categories
    fetch('/api/categories')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setCategories(result.data.filter((c: Category) => c.isActive));
        }
      })
      .catch(console.error);
  }, []);

  const onSubmit = async (data: TicketCreateInput) => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '티켓 생성에 실패했습니다');
      }

      toast.success('티켓이 생성되었습니다');
      router.push(`/tickets/${result.data.id}`);
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error(
        error instanceof Error ? error.message : '티켓 생성 중 오류가 발생했습니다'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">제목 *</Label>
        <Input
          id="title"
          {...register('title')}
          placeholder="문의 제목을 입력하세요"
          disabled={isLoading}
        />
        {errors.title && (
          <p className="text-sm text-red-500">{errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">내용 *</Label>
        <Textarea
          id="content"
          {...register('content')}
          placeholder="문의 내용을 상세히 입력하세요"
          rows={8}
          disabled={isLoading}
        />
        {errors.content && (
          <p className="text-sm text-red-500">{errors.content.message}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="priority">우선순위 *</Label>
          <Select
            value={priority}
            onValueChange={(value) =>
              setValue('priority', value as 'low' | 'medium' | 'high')
            }
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">낮음</SelectItem>
              <SelectItem value="medium">보통</SelectItem>
              <SelectItem value="high">높음</SelectItem>
            </SelectContent>
          </Select>
          {errors.priority && (
            <p className="text-sm text-red-500">{errors.priority.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="categoryId">카테고리</Label>
          <Select
            value={categoryId}
            onValueChange={(value) => setValue('categoryId', value)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categoryId && (
            <p className="text-sm text-red-500">{errors.categoryId.message}</p>
          )}
        </div>
      </div>

      {/* AI Category Suggestion */}
      {title && content && title.length > 10 && content.length > 20 && (
        <CategorySuggestion
          title={title}
          content={content}
          onSuggestionAccepted={(categoryId) => {
            setValue('categoryId', categoryId);
          }}
          disabled={isLoading}
        />
      )}

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          취소
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '생성 중...' : '티켓 생성'}
        </Button>
      </div>
    </form>
  );
}
