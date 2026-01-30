'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Info } from 'lucide-react';
import type { AIPromptTemplate, Category } from '@/lib/db/schema';

interface TemplateFormProps {
  template?: AIPromptTemplate | null;
  availableCategories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
}

const DEFAULT_SYSTEM_PROMPT = `당신은 친절하고 전문적인 고객 지원 AI입니다.
다음 규칙을 따라주세요:
1. 정확하고 명확한 답변을 제공하세요
2. 고객의 감정을 이해하고 공감하세요
3. 지식베이스의 정보를 우선 활용하세요
4. 불확실한 정보는 추측하지 말고 담당자에게 문의하도록 안내하세요
5. 한국어로 답변하세요`;

const DEFAULT_USER_PROMPT = `다음 고객 문의에 대한 답변 초안을 작성해주세요:

카테고리: {category}
제목: {title}
내용: {content}

관련 지식베이스:
{knowledge_base}

답변 요구사항:
- 명확하고 구체적인 해결 방법 제시
- 친절하고 전문적인 어조
- 추가 정보가 필요한 경우 명시
- 200-500자 정도의 적절한 길이`;

export default function TemplateForm({
  template,
  availableCategories,
  onSuccess,
  onCancel,
}: TemplateFormProps) {
  const [categoryId, setCategoryId] = useState<string>('');
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [userPromptTemplate, setUserPromptTemplate] = useState(DEFAULT_USER_PROMPT);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (template) {
      setCategoryId(template.categoryId || '');
      setSystemPrompt(template.systemPrompt);
      setUserPromptTemplate(template.userPromptTemplate);
    } else {
      setCategoryId('');
      setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
      setUserPromptTemplate(DEFAULT_USER_PROMPT);
    }
  }, [template]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryId && !template) {
      toast({
        title: '입력 오류',
        description: '카테고리를 선택해주세요',
        variant: 'destructive',
      });
      return;
    }

    if (!systemPrompt.trim() || !userPromptTemplate.trim()) {
      toast({
        title: '입력 오류',
        description: '시스템 프롬프트와 사용자 프롬프트를 모두 입력해주세요',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        systemPrompt: systemPrompt.trim(),
        userPromptTemplate: userPromptTemplate.trim(),
      };

      // Only include categoryId when creating
      if (!template) {
        payload.categoryId = categoryId;
      }

      const url = template ? `/api/templates/${template.id}` : '/api/templates';
      const method = template ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: '성공',
          description: data.message || `AI 템플릿이 ${template ? '수정' : '생성'}되었습니다`,
        });
        onSuccess();
      } else {
        toast({
          title: '오류',
          description: data.error || `AI 템플릿 ${template ? '수정' : '생성'}에 실패했습니다`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '오류',
        description: `AI 템플릿 ${template ? '수정' : '생성'}에 실패했습니다`,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Category Selection (only for new templates) */}
      {!template && (
        <div className="space-y-2">
          <Label htmlFor="category">
            카테고리 <span className="text-destructive">*</span>
          </Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="category">
              <SelectValue placeholder="카테고리 선택" />
            </SelectTrigger>
            <SelectContent>
              {availableCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-sm text-muted-foreground">
            선택한 카테고리의 티켓에 이 템플릿이 적용됩니다.
          </p>
        </div>
      )}

      {/* System Prompt */}
      <div className="space-y-2">
        <Label htmlFor="systemPrompt">
          시스템 프롬프트 <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="systemPrompt"
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          placeholder="AI의 역할과 행동 방식을 정의하세요"
          rows={8}
          maxLength={5000}
          required
          className="font-mono text-sm"
        />
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            AI의 성격, 어조, 답변 규칙을 정의합니다
          </p>
          <p className="text-sm text-muted-foreground">{systemPrompt.length}/5,000자</p>
        </div>
      </div>

      {/* User Prompt Template */}
      <div className="space-y-2">
        <Label htmlFor="userPromptTemplate">
          사용자 프롬프트 템플릿 <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="userPromptTemplate"
          value={userPromptTemplate}
          onChange={(e) => setUserPromptTemplate(e.target.value)}
          placeholder="티켓 정보를 AI에게 전달하는 방식을 정의하세요"
          rows={10}
          maxLength={5000}
          required
          className="font-mono text-sm"
        />
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              사용 가능한 변수:
            </p>
            <ul className="text-xs text-muted-foreground space-y-0.5 ml-4">
              <li>• <code className="bg-muted px-1 py-0.5 rounded">{'{title}'}</code> - 티켓 제목</li>
              <li>• <code className="bg-muted px-1 py-0.5 rounded">{'{content}'}</code> - 티켓 내용</li>
              <li>• <code className="bg-muted px-1 py-0.5 rounded">{'{category}'}</code> - 카테고리명</li>
              <li>• <code className="bg-muted px-1 py-0.5 rounded">{'{knowledge_base}'}</code> - 관련 지식베이스</li>
            </ul>
          </div>
          <p className="text-sm text-muted-foreground">{userPromptTemplate.length}/5,000자</p>
        </div>
      </div>

      {/* Example */}
      <div className="bg-muted p-4 rounded-lg border">
        <p className="text-sm font-medium mb-2">프롬프트 미리보기 예시</p>
        <div className="space-y-2 text-xs">
          <div>
            <span className="font-medium">시스템:</span>
            <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
              {systemPrompt.substring(0, 150)}
              {systemPrompt.length > 150 ? '...' : ''}
            </p>
          </div>
          <div>
            <span className="font-medium">사용자:</span>
            <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
              {userPromptTemplate
                .replace('{title}', '로그인이 안됩니다')
                .replace('{content}', '아이디와 비밀번호를 입력해도 로그인이 되지 않습니다.')
                .replace('{category}', '로그인/인증')
                .replace('{knowledge_base}', '[관련 지식베이스 내용...]')
                .substring(0, 200)}
              {userPromptTemplate.length > 200 ? '...' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          취소
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? '처리 중...' : template ? '수정' : '생성'}
        </Button>
      </div>
    </form>
  );
}
