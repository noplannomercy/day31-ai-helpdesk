'use client';

import { useState } from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';
import type { UserRole } from '@/lib/types';

interface MainLayoutProps {
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
    role: UserRole;
  } | null;
}

export function MainLayout({ children, user }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} onMenuClick={() => setSidebarOpen(true)} />
      <div className="flex">
        <Sidebar
          userRole={user?.role}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
