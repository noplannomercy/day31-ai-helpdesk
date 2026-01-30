import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TicketForm } from '@/components/tickets/ticket-form';

export default function NewTicketPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">새 티켓 생성</h1>
        <p className="text-gray-500">문의 사항을 등록하세요</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>티켓 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketForm />
        </CardContent>
      </Card>
    </div>
  );
}
