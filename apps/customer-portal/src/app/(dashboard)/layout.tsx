'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingCart,
  FlaskConical,
  FileCheck,
  CreditCard,
  MessageSquare,
  Bookmark,
  Settings,
  LogOut,
  Beaker,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const menu = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Orders', href: '/orders', icon: ShoppingCart },
  { label: 'Samples', href: '/samples', icon: FlaskConical },
  { label: 'Reports & COAs', href: '/reports', icon: FileCheck },
  { label: 'Billing', href: '/billing', icon: CreditCard },
  { label: 'Messages', href: '/messages', icon: MessageSquare },
  { label: 'Templates', href: '/templates', icon: Bookmark },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) router.push('/login');
  }, [isAuthenticated, router]);

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Beaker className="w-6 h-6 text-sky-600 mr-2" />
          <span className="font-bold text-lg">TruSource</span>
          <span className="ml-2 text-xs text-gray-500 uppercase">Customer</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium',
                  active
                    ? 'bg-sky-50 text-sky-700 border-l-2 border-sky-600'
                    : 'text-gray-700 hover:bg-gray-50',
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <p className="text-xs text-gray-500">Signed in as</p>
          <p className="text-sm font-medium">{user?.email}</p>
          <button
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
            className="flex items-center gap-2 mt-3 text-sm text-red-600 hover:text-red-700"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}