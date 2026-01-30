'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X } from 'lucide-react';
import type { TicketStatus, TicketPriority } from '@/lib/types';
import type { Category } from '@/lib/db/schema';

interface TicketFiltersProps {
  onFilterChange: (filters: {
    status?: TicketStatus;
    priority?: TicketPriority;
    categoryId?: string;
    search?: string;
  }) => void;
}

export function TicketFilters({ onFilterChange }: TicketFiltersProps) {
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    // Load categories
    fetch('/api/categories')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setCategories(result.data.filter((c: Category) => c.isActive));
        }
      })
      .catch(console.error);
  }, []);

  const handleApplyFilters = () => {
    onFilterChange({
      status: status as TicketStatus || undefined,
      priority: priority as TicketPriority || undefined,
      categoryId: categoryId || undefined,
      search: search || undefined,
    });
  };

  const handleClearFilters = () => {
    setStatus('');
    setPriority('');
    setCategoryId('');
    setSearch('');
    onFilterChange({});
  };

  return (
    <div className="bg-white p-4 rounded-lg border space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>검색</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="제목이나 내용 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()}
              className="pl-8"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>상태</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="open">열림</SelectItem>
              <SelectItem value="in_progress">진행중</SelectItem>
              <SelectItem value="resolved">해결됨</SelectItem>
              <SelectItem value="closed">닫힘</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>우선순위</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              <SelectItem value="low">낮음</SelectItem>
              <SelectItem value="medium">보통</SelectItem>
              <SelectItem value="high">높음</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>카테고리</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="전체" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleApplyFilters} size="sm">
          <Search className="h-4 w-4 mr-2" />
          필터 적용
        </Button>
        <Button onClick={handleClearFilters} variant="outline" size="sm">
          <X className="h-4 w-4 mr-2" />
          필터 초기화
        </Button>
      </div>
    </div>
  );
}
