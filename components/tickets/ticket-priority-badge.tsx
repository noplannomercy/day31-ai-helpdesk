import { Badge } from '@/components/ui/badge';
import { TICKET_PRIORITY } from '@/lib/constants';
import type { TicketPriority } from '@/lib/types';

interface TicketPriorityBadgeProps {
  priority: TicketPriority;
}

export function TicketPriorityBadge({ priority }: TicketPriorityBadgeProps) {
  const config = TICKET_PRIORITY[priority];

  const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    gray: 'secondary',
    blue: 'default',
    red: 'destructive',
  };

  return (
    <Badge variant={variantMap[config.color] || 'default'}>
      {config.label}
    </Badge>
  );
}
