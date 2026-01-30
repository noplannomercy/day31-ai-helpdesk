'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { categoryCreateSchema, type CategoryCreateInput } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import type { Category } from '@/lib/db/schema';

interface CategoryFormProps {
  category?: Category;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CategoryForm({ category, onSuccess, onCancel }: CategoryFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categoryCreateSchema),
    defaultValues: {
      name: category?.name || '',
      sortOrder: category?.sortOrder || 0,
      isActive: category?.isActive ?? true,
    },
  });

  const isActive = watch('isActive');

  const onSubmit = async (data: CategoryCreateInput) => {
    setIsLoading(true);

    try {
      const url = category
        ? `/api/categories/${category.id}`
        : '/api/categories';
      const method = category ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || '카테고리 저장에 실패했습니다');
      }

      toast.success(result.message || '카테고리가 저장되었습니다');
      onSuccess?.();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(
        error instanceof Error ? error.message : '카테고리 저장 중 오류가 발생했습니다'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">카테고리명 *</Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="예: 기술 지원"
          disabled={isLoading}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="sortOrder">정렬 순서</Label>
        <Input
          id="sortOrder"
          type="number"
          {...register('sortOrder', { valueAsNumber: true })}
          placeholder="0"
          disabled={isLoading}
        />
        {errors.sortOrder && (
          <p className="text-sm text-red-500">{errors.sortOrder.message}</p>
        )}
        <p className="text-sm text-gray-500">낮은 숫자가 먼저 표시됩니다</p>
      </div>

      <div className="flex items-center justify-between space-x-2">
        <Label htmlFor="isActive">활성 상태</Label>
        <Switch
          id="isActive"
          checked={isActive}
          onCheckedChange={(checked) => setValue('isActive', checked)}
          disabled={isLoading}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            취소
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? '저장 중...' : category ? '수정' : '생성'}
        </Button>
      </div>
    </form>
  );
}
