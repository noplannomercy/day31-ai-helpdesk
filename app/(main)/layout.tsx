import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { MainLayout } from "@/components/layout/main-layout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Help Desk",
  description: "AI Help Desk - 고객 지원 플랫폼",
};

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <MainLayout user={session.user}>{children}</MainLayout>;
}
