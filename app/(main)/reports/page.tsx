import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ReportsDashboard } from "@/components/reports/reports-dashboard";

export default async function ReportsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Only Manager and Admin can access reports
  if (session.user.role !== "manager" && session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto p-6">
      <ReportsDashboard />
    </div>
  );
}
