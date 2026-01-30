import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { RecentTickets } from "@/components/dashboard/recent-tickets";
import { ErrorBoundary } from "@/components/common/error-boundary";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
          <p className="text-muted-foreground">
            환영합니다, {session.user.name}님!
          </p>
        </div>

        <DashboardStats />

        <RecentTickets />
      </div>
    </ErrorBoundary>
  );
}
