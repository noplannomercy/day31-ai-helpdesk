import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인 - AI Help Desk",
  description: "AI Help Desk 로그인",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <div className="w-full max-w-md px-4">
        {children}
      </div>
    </div>
  );
}
