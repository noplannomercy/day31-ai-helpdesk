/**
 * Sentiment Badge Component
 *
 * Displays sentiment analysis result as a colored badge.
 */

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type SentimentType = 'positive' | 'neutral' | 'negative';

interface SentimentBadgeProps {
  sentiment: SentimentType;
  confidence?: number;
  className?: string;
  showConfidence?: boolean;
}

const sentimentConfig = {
  positive: {
    label: '긍정',
    variant: 'default' as const,
    className: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800',
  },
  neutral: {
    label: '중립',
    variant: 'secondary' as const,
    className: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800',
  },
  negative: {
    label: '부정',
    variant: 'destructive' as const,
    className: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  },
};

export function SentimentBadge({
  sentiment,
  confidence,
  className,
  showConfidence = false,
}: SentimentBadgeProps) {
  const config = sentimentConfig[sentiment];

  if (!config) {
    return null;
  }

  const confidenceText = confidence
    ? ` (${Math.round(confidence * 100)}%)`
    : '';

  return (
    <Badge
      variant={config.variant}
      className={cn(
        'border',
        config.className,
        className
      )}
    >
      {config.label}
      {showConfidence && confidenceText}
    </Badge>
  );
}
