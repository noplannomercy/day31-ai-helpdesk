import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth-utils';
import TemplateManagement from '@/components/admin/template-management';

export const metadata: Metadata = {
  title: 'AI 템플릿 관리 | AI Help Desk',
  description: 'AI 프롬프트 템플릿 관리 페이지',
};

export default async function TemplatesPage() {
  // Check authorization (Admin only)
  await requireAdmin();

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">AI 템플릿 관리</h1>
        <p className="text-muted-foreground mt-2">
          카테고리별 AI 프롬프트 템플릿을 관리합니다. 각 카테고리에 대해 AI가 어떻게 답변할지 정의할 수 있습니다.
        </p>
      </div>
      <TemplateManagement />
    </div>
  );
}
