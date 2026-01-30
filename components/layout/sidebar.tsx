'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Ticket,
  Users,
  Settings,
  FileText,
  BarChart3,
  BookOpen,
  Tags,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface SidebarProps {
  userRole?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const menuItems = {
  main: [
    {
      href: '/dashboard',
      label: '대시보드',
      icon: LayoutDashboard,
      roles: ['customer', 'agent', 'manager', 'admin'],
    },
    {
      href: '/tickets',
      label: '티켓',
      icon: Ticket,
      roles: ['customer', 'agent', 'manager', 'admin'],
    },
    {
      href: '/reports',
      label: '보고서',
      icon: BarChart3,
      roles: ['manager', 'admin'],
    },
  ],
  admin: [
    {
      href: '/users',
      label: '사용자 관리',
      icon: Users,
      roles: ['admin'],
    },
    {
      href: '/categories',
      label: '카테고리 관리',
      icon: Tags,
      roles: ['admin'],
    },
    {
      href: '/knowledge-base',
      label: '지식베이스',
      icon: BookOpen,
      roles: ['admin', 'manager'],
    },
    {
      href: '/templates',
      label: 'AI 템플릿',
      icon: FileText,
      roles: ['admin'],
    },
  ],
};

export function Sidebar({ userRole = 'customer', isOpen = true, onClose }: SidebarProps) {
  const pathname = usePathname();

  const canViewItem = (roles: string[]) => roles.includes(userRole);

  const mainMenuItems = menuItems.main.filter((item) => canViewItem(item.roles));
  const adminMenuItems = menuItems.admin.filter((item) => canViewItem(item.roles));

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-background transition-transform md:sticky md:top-16 md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Close button for mobile */}
          <div className="flex items-center justify-between p-4 md:hidden">
            <span className="text-lg font-semibold">메뉴</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 space-y-2 p-4">
            {/* Main menu */}
            <div className="space-y-1">
              {mainMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Admin menu */}
            {adminMenuItems.length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="space-y-1">
                  <div className="px-3 py-2">
                    <h3 className="text-xs font-semibold uppercase text-muted-foreground">
                      관리
                    </h3>
                  </div>
                  {adminMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      pathname === item.href || pathname.startsWith(item.href + '/');

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={onClose}
                        className={cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                          isActive
                            ? 'bg-accent text-accent-foreground'
                            : 'text-muted-foreground'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <Link
              href="/settings"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Settings className="h-5 w-5" />
              설정
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
