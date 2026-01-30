'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Search, Filter } from 'lucide-react';
import KnowledgeBaseForm from './knowledge-base-form';
import { useToast } from '@/hooks/use-toast';
import type { KnowledgeBase, Category } from '@/lib/db/schema';

interface KnowledgeBaseWithCategory extends KnowledgeBase {
  categoryName: string | null;
}

export default function KnowledgeBaseManagement() {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBaseWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingKB, setEditingKB] = useState<KnowledgeBaseWithCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchKnowledgeBases();
    fetchCategories();
  }, [selectedCategory, statusFilter]);

  const fetchKnowledgeBases = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (selectedCategory !== 'all') {
        params.append('categoryId', selectedCategory);
      }

      if (statusFilter !== 'all') {
        params.append('isActive', statusFilter);
      }

      const response = await fetch(`/api/knowledge-base?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setKnowledgeBases(data.data);
      } else {
        toast({
          title: '오류',
          description: data.error || '지식베이스 목록을 불러오는데 실패했습니다',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '지식베이스 목록을 불러오는데 실패했습니다',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.data.filter((cat: Category) => cat.isActive));
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleCreate = () => {
    setEditingKB(null);
    setIsFormOpen(true);
  };

  const handleEdit = (kb: KnowledgeBaseWithCategory) => {
    setEditingKB(kb);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말로 이 지식베이스를 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/knowledge-base/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        toast({
          title: '성공',
          description: '지식베이스가 삭제되었습니다',
        });
        fetchKnowledgeBases();
      } else {
        toast({
          title: '오류',
          description: data.error || '지식베이스 삭제에 실패했습니다',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '지식베이스 삭제에 실패했습니다',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (kb: KnowledgeBaseWithCategory) => {
    try {
      const response = await fetch(`/api/knowledge-base/${kb.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !kb.isActive }),
      });
      const data = await response.json();

      if (data.success) {
        toast({
          title: '성공',
          description: `지식베이스가 ${!kb.isActive ? '활성화' : '비활성화'}되었습니다`,
        });
        fetchKnowledgeBases();
      } else {
        toast({
          title: '오류',
          description: data.error || '상태 변경에 실패했습니다',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '오류',
        description: '상태 변경에 실패했습니다',
        variant: 'destructive',
      });
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingKB(null);
    fetchKnowledgeBases();
  };

  const filteredKnowledgeBases = knowledgeBases.filter((kb) =>
    searchQuery === ''
      ? true
      : kb.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kb.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="제목 또는 내용으로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 카테고리</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 상태</SelectItem>
              <SelectItem value="true">활성</SelectItem>
              <SelectItem value="false">비활성</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          지식베이스 추가
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>제목</TableHead>
              <TableHead>카테고리</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>최종 수정일</TableHead>
              <TableHead className="text-right">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  로딩 중...
                </TableCell>
              </TableRow>
            ) : filteredKnowledgeBases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  지식베이스가 없습니다
                </TableCell>
              </TableRow>
            ) : (
              filteredKnowledgeBases.map((kb) => (
                <TableRow key={kb.id}>
                  <TableCell className="font-medium max-w-xs truncate">
                    {kb.title}
                  </TableCell>
                  <TableCell>
                    {kb.categoryName ? (
                      <Badge variant="outline">{kb.categoryName}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">미분류</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={kb.isActive ? 'default' : 'secondary'}
                      className="cursor-pointer"
                      onClick={() => handleToggleActive(kb)}
                    >
                      {kb.isActive ? '활성' : '비활성'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(kb.updatedAt).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(kb)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(kb.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingKB ? '지식베이스 수정' : '지식베이스 추가'}
            </DialogTitle>
            <DialogDescription>
              AI가 고객 문의에 답변할 때 참조할 지식베이스를 {editingKB ? '수정' : '추가'}합니다.
            </DialogDescription>
          </DialogHeader>
          <KnowledgeBaseForm
            knowledgeBase={editingKB}
            categories={categories}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
