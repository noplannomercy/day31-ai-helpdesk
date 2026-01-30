/**
 * AI Response Panel Component
 *
 * Displays AI-generated answer suggestions for agents.
 * Allows agents to review, edit, and approve AI responses.
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, CheckCircle2, Copy, RefreshCw, Book } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AIResponseResult {
  response: string;
  usedKB: boolean;
  kbEntriesUsed: number;
}

interface AIResponsePanelProps {
  ticketId: string;
  onResponseAccepted?: (response: string) => void;
  className?: string;
  disabled?: boolean;
}

export function AIResponsePanel({
  ticketId,
  onResponseAccepted,
  className,
  disabled = false,
}: AIResponsePanelProps) {
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIResponseResult | null>(null);
  const [editedResponse, setEditedResponse] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      setError(null);
      setAiResponse(null);
      setEditedResponse('');
      setIsEditing(false);

      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ticketId,
          useCustomPrompt: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'AI 답변을 생성할 수 없습니다.');
      }

      const result = await response.json();
      setAiResponse(result.data);
      setEditedResponse(result.data.response);

    } catch (err) {
      console.error('AI response generation error:', err);
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (editedResponse) {
      navigator.clipboard.writeText(editedResponse);
      toast.success('답변이 클립보드에 복사되었습니다.');
    }
  };

  const handleAccept = () => {
    if (editedResponse && onResponseAccepted) {
      onResponseAccepted(editedResponse);
      toast.success('AI 답변이 적용되었습니다.');
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              AI 답변 제안
            </CardTitle>
            <CardDescription>
              AI가 생성한 답변 초안을 검토하고 수정하여 사용할 수 있습니다.
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={disabled || loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                {aiResponse ? (
                  <RefreshCw className="h-4 w-4" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {aiResponse ? '재생성' : '답변 생성'}
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>
              {error}
              <div className="mt-2 text-sm">
                수동으로 답변을 작성하거나 나중에 다시 시도해주세요.
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* AI Response */}
        {aiResponse && !error && (
          <div className="space-y-4">
            {/* Metadata */}
            <div className="flex items-center gap-2">
              {aiResponse.usedKB && (
                <Badge variant="outline" className="gap-1.5 text-green-700 border-green-300 bg-green-50">
                  <Book className="h-3 w-3" />
                  지식베이스 참조 ({aiResponse.kbEntriesUsed}개)
                </Badge>
              )}
            </div>

            {/* Response Text */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">
                  {isEditing ? 'AI 답변 편집' : 'AI 답변'}
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                >
                  {isEditing ? '보기 모드' : '편집 모드'}
                </Button>
              </div>

              {isEditing ? (
                <Textarea
                  value={editedResponse}
                  onChange={(e) => setEditedResponse(e.target.value)}
                  rows={12}
                  className="font-mono text-sm"
                  placeholder="AI 답변을 수정하세요..."
                />
              ) : (
                <div className="p-4 rounded-lg border bg-muted/50 whitespace-pre-wrap text-sm">
                  {editedResponse}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleAccept}
                disabled={!editedResponse.trim()}
                className="gap-1.5"
              >
                <CheckCircle2 className="h-4 w-4" />
                답변 적용
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCopy}
                disabled={!editedResponse.trim()}
                className="gap-1.5"
              >
                <Copy className="h-4 w-4" />
                복사
              </Button>
            </div>

            {/* Warning */}
            <Alert>
              <AlertDescription className="text-xs">
                ⚠️ AI가 생성한 답변은 반드시 검토 후 사용하세요. 부정확한 내용이 포함될 수 있습니다.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Empty State */}
        {!aiResponse && !error && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              AI 답변 생성 버튼을 클릭하여 답변 초안을 받아보세요.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
