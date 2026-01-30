import { Badge } from '@/components/ui/badge';
import { TICKET_STATUS } from '@/lib/constants';
import type { TicketStatus } from '@/lib/types';

interface TicketStatusBadgeProps {
  status: TicketStatus;
}

export function TicketStatusBadge({ status }: TicketStatusBadgeProps) {
  const config = TICKET_STATUS[status];

  const variantMap: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    blue: 'default',
    yellow: 'secondary',
    green: 'outline',
    gray: 'secondary',
  };

  return (
    <Badge variant={variantMap[config.color] || 'default'}>
      {config.label}
    </Badge>
  );
}
