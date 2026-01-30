/**
 * Category Suggestion Component
 *
 * Suggests a category based on ticket title and content using AI.
 * Displays during ticket creation.
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategorySuggestion {
  categoryId: string | null;
  categoryName: string | null;
  confidence: number;
  reason: string;
}

interface CategorySuggestionProps {
  title: string;
  content: string;
  onSuggestionAccepted?: (categoryId: string, categoryName: string) => void;
  className?: string;
  disabled?: boolean;
}

export function CategorySuggestion({
  title,
  content,
  onSuggestionAccepted,
  className,
  disabled = false,
}: CategorySuggestionProps) {
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<CategorySuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);

  const handleSuggest = async () => {
    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 모두 입력해주세요.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuggestion(null);
      setAccepted(false);

      const response = await fetch('/api/ai/classify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '카테고리 추천을 가져올 수 없습니다.');
      }

      const result = await response.json();
      setSuggestion(result.data);

    } catch (err) {
      console.error('Category suggestion error:', err);
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (suggestion?.categoryId && suggestion?.categoryName && onSuggestionAccepted) {
      onSuggestionAccepted(suggestion.categoryId, suggestion.categoryName);
      setAccepted(true);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Suggest Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleSuggest}
        disabled={disabled || loading || !title.trim() || !content.trim()}
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        AI 카테고리 추천
      </Button>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Suggestion Result */}
      {suggestion && !error && (
        <Alert className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/30">
          <AlertDescription>
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-1">
                  {suggestion.categoryName ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">추천 카테고리:</span>
                        <Badge variant="default" className="bg-blue-600">
                          {suggestion.categoryName}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          신뢰도 {Math.round(suggestion.confidence * 100)}%
                        </Badge>
                      </div>
                      {suggestion.reason && (
                        <p className="text-xs text-muted-foreground">
                          {suggestion.reason}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm">
                      적절한 카테고리를 찾을 수 없습니다. 수동으로 선택해주세요.
                    </p>
                  )}
                </div>

                {suggestion.categoryId && !accepted && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAccept}
                    className="gap-1.5"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    적용
                  </Button>
                )}

                {accepted && (
                  <Badge variant="default" className="bg-green-600 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    적용됨
                  </Badge>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
