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
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';
import TemplateForm from './template-form';
import { useToast } from '@/hooks/use-toast';
import type { AIPromptTemplate, Category } from '@/lib/db/schema';

interface TemplateWithCategory extends AIPromptTemplate {
  categoryName: string | null;
}

export default function TemplateManagement() {
  const [templates, setTemplates] = useState<TemplateWithCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateWithCategory | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchTemplates();
    fetchCategories();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/templates');
      const data = await response.json();

      if (data.success) {
        setTemplates(data.data);
      } else {
        toast({
          title: '오류',
          description: data.error || 'AI 템플릿 목록을 불러오는데 실패했습니다',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '오류',
        description: 'AI 템플릿 목록을 불러오는데 실패했습니다',
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
        // Only show active categories that don't have templates yet
        setCategories(data.data.filter((cat: Category) => cat.isActive));
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setIsFormOpen(true);
  };

  const handleEdit = (template: TemplateWithCategory) => {
    setEditingTemplate(template);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string, categoryName: string | null) => {
    if (!confirm(`"${categoryName}" 카테고리의 AI 템플릿을 정말로 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();

      if (data.success) {
        toast({
          title: '성공',
          description: 'AI 템플릿이 삭제되었습니다',
        });
        fetchTemplates();
        fetchCategories(); // Refresh categories to show available ones
      } else {
        toast({
          title: '오류',
          description: data.error || 'AI 템플릿 삭제에 실패했습니다',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '오류',
        description: 'AI 템플릿 삭제에 실패했습니다',
        variant: 'destructive',
      });
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingTemplate(null);
    fetchTemplates();
    fetchCategories(); // Refresh categories
  };

  // Get available categories (without templates)
  const availableCategories = categories.filter(
    (cat) => !templates.some((t) => t.categoryId === cat.id)
  );

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="bg-muted p-4 rounded-lg border">
        <div className="flex gap-2">
          <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-medium">AI 템플릿 안내</p>
            <p className="text-sm text-muted-foreground">
              각 카테고리에 대해 하나의 템플릿을 설정할 수 있습니다. 템플릿은 시스템 프롬프트와 사용자 프롬프트로 구성됩니다.
              사용자 프롬프트에는 변수를 사용할 수 있습니다: {'{title}'}, {'{content}'}, {'{category}'}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          총 {templates.length}개의 템플릿
        </p>
        <Button onClick={handleCreate} disabled={availableCategories.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          AI 템플릿 추가
        </Button>
      </div>

      {availableCategories.length === 0 && templates.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            모든 카테고리에 템플릿이 설정되었습니다. 새 템플릿을 추가하려면 먼저 새 카테고리를 생성하세요.
          </p>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>카테고리</TableHead>
              <TableHead>시스템 프롬프트</TableHead>
              <TableHead>사용자 프롬프트 템플릿</TableHead>
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
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">등록된 AI 템플릿이 없습니다</p>
                    {availableCategories.length > 0 && (
                      <Button onClick={handleCreate} size="sm" className="mt-2">
                        <Plus className="h-4 w-4 mr-2" />
                        첫 템플릿 추가하기
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <Badge>{template.categoryName || '기본'}</Badge>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="truncate text-sm text-muted-foreground">
                      {template.systemPrompt.substring(0, 100)}
                      {template.systemPrompt.length > 100 ? '...' : ''}
                    </p>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <p className="truncate text-sm text-muted-foreground font-mono">
                      {template.userPromptTemplate.substring(0, 100)}
                      {template.userPromptTemplate.length > 100 ? '...' : ''}
                    </p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(template.updatedAt).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(template.id, template.categoryName)}
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingTemplate ? 'AI 템플릿 수정' : 'AI 템플릿 추가'}
            </DialogTitle>
            <DialogDescription>
              카테고리별로 AI가 어떻게 답변할지 정의합니다. 시스템 프롬프트는 AI의 역할과 행동을 정의하고,
              사용자 프롬프트 템플릿은 티켓 정보를 AI에게 전달하는 방식을 정의합니다.
            </DialogDescription>
          </DialogHeader>
          <TemplateForm
            template={editingTemplate}
            availableCategories={availableCategories}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
