import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { TicketList } from '@/components/tickets/ticket-list';
import { Plus } from 'lucide-react';
import { ErrorBoundary } from '@/components/common/error-boundary';

export default function TicketsPage() {
  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">티켓 목록</h1>
            <p className="text-gray-500">고객 문의 티켓을 관리합니다</p>
          </div>
          <Link href="/tickets/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              새 티켓 생성
            </Button>
          </Link>
        </div>

        <TicketList />
      </div>
    </ErrorBoundary>
  );
}
