import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "관리자 - AI Help Desk",
  description: "AI Help Desk 관리자 페이지",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Check if user is authenticated and is an admin
  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">관리자 페이지</h1>
          <p className="text-sm text-muted-foreground">
            시스템 설정 및 사용자 관리
          </p>
        </div>
      </div>
      <div className="container mx-auto px-4 py-6">{children}</div>
    </div>
  );
}
