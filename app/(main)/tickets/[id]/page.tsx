import { notFound, redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { TicketDetail } from '@/components/tickets/ticket-detail';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getTicketById, canReopenTicket } from '@/lib/services/ticket-service';

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const { id } = await params;
  const ticket = await getTicketById(id, session.user.id, session.user.role);

  if (!ticket) {
    notFound();
  }

  const canReopen =
    ticket.status === 'closed' &&
    ticket.closedAt !== null &&
    canReopenTicket(new Date(ticket.closedAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/tickets">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">티켓 상세</h1>
          <p className="text-gray-500">티켓 #{id.slice(0, 8)}</p>
        </div>
      </div>

      <TicketDetail ticket={ticket} userRole={session.user.role} canReopenTicket={!!canReopen} />
    </div>
  );
}
