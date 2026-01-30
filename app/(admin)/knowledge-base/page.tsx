import { Metadata } from 'next';
import { requireManagerOrAdmin } from '@/lib/auth-utils';
import KnowledgeBaseManagement from '@/components/admin/knowledge-base-management';

export const metadata: Metadata = {
  title: '지식베이스 관리 | AI Help Desk',
  description: '지식베이스 관리 페이지',
};

export default async function KnowledgeBasePage() {
  // Check authorization
  await requireManagerOrAdmin();

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">지식베이스 관리</h1>
        <p className="text-muted-foreground mt-2">
          AI가 참조할 지식베이스를 관리합니다. 카테고리별로 분류하여 고객 문의에 대한 답변 품질을 향상시킬 수 있습니다.
        </p>
      </div>
      <KnowledgeBaseManagement />
    </div>
  );
}
