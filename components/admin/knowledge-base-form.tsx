'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { KnowledgeBase, Category } from '@/lib/db/schema';

interface KnowledgeBaseFormProps {
  knowledgeBase?: KnowledgeBase | null;
  categories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
}

export default function KnowledgeBaseForm({
  knowledgeBase,
  categories,
  onSuccess,
  onCancel,
}: KnowledgeBaseFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (knowledgeBase) {
      setTitle(knowledgeBase.title);
      setContent(knowledgeBase.content);
      setCategoryId(knowledgeBase.categoryId || '');
      setIsActive(knowledgeBase.isActive);
    } else {
      setTitle('');
      setContent('');
      setCategoryId('');
      setIsActive(true);
    }
  }, [knowledgeBase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast({
        title: '입력 오류',
        description: '제목과 내용을 모두 입력해주세요',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        content: content.trim(),
        categoryId: categoryId || undefined,
        isActive,
      };

      const url = knowledgeBase
        ? `/api/knowledge-base/${knowledgeBase.id}`
        : '/api/knowledge-base';

      const method = knowledgeBase ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '성공',
          description: data.message || `지식베이스가 ${knowledgeBase ? '수정' : '생성'}되었습니다`,
        });
        onSuccess();
      } else {
        toast({
          title: '오류',
          description: data.error || `지식베이스 ${knowledgeBase ? '수정' : '생성'}에 실패했습니다`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '오류',
        description: `지식베이스 ${knowledgeBase ? '수정' : '생성'}에 실패했습니다`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">
          제목 <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="지식베이스 제목 (5-200자)"
          maxLength={200}
          required
        />
        <p className="text-sm text-muted-foreground">
          {title.length}/200자
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">
          내용 <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="지식베이스 내용을 입력하세요. Markdown 형식을 지원합니다. (10-10000자)"
          rows={12}
          maxLength={10000}
          required
          className="font-mono text-sm"
        />
        <p className="text-sm text-muted-foreground">
          {content.length}/10,000자
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">카테고리</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger id="category">
            <SelectValue placeholder="카테고리 선택 (선택사항)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">미분류</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          특정 카테고리의 티켓에만 이 지식베이스를 적용하려면 카테고리를 선택하세요.
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={isActive}
          onCheckedChange={setIsActive}
        />
        <Label htmlFor="isActive" className="cursor-pointer">
          활성 상태
        </Label>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          취소
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? '처리 중...' : knowledgeBase ? '수정' : '생성'}
        </Button>
      </div>
    </form>
  );
}
