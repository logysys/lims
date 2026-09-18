'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FlaskConical,
  TestTube,
  ShieldCheck,
  FileCheck,
  Package,
  Microscope,
  Users,
  Settings,
  BarChart3,
  ScrollText,
  MessageSquare,
  Bell,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/lib/auth-store';

const menuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['analyst', 'qa', 'lab_admin'] },
  { label: 'My Queue', href: '/queue', icon: TestTube, roles: ['analyst', 'qa'] },
  { label: 'Samples', href: '/samples', icon: FlaskConical, roles: ['analyst', 'qa', 'lab_admin'] },
  { label: 'Testing', href: '/testing', icon: Microscope, roles: ['analyst'] },
  { label: 'Quality', href: '/quality', icon: ShieldCheck, roles: ['qa', 'lab_admin'] },
  { label: 'COAs', href: '/coa', icon: FileCheck, roles: ['qa', 'lab_admin'] },
  { label: 'Inventory', href: '/inventory', icon: Package, roles: ['analyst', 'lab_admin'] },
  { label: 'Instruments', href: '/instruments', icon: Microscope, roles: ['analyst', 'lab_admin'] },
  { label: 'Reports', href: '/reports', icon: BarChart3, roles: ['qa', 'lab_admin'] },
  { label: 'Messages', href: '/messages', icon: MessageSquare, roles: ['analyst', 'qa', 'lab_admin'] },
  { label: 'Audit Trail', href: '/audit', icon: ScrollText, roles: ['qa', 'lab_admin'] },
  { label: 'Users', href: '/users', icon: Users, roles: ['lab_admin'] },
  { label: 'Settings', href: '/settings', icon: Settings, roles: ['analyst', 'qa', 'lab_admin'] },
];

export function Sidebar() {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const role = user?.role || 'analyst';

  const visibleItems = menuItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <FlaskConical className="w-6 h-6 text-sky-600 mr-2" />
        <span className="font-bold text-lg text-gray-900">TruSource</span>
      </div>

      <nav className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sky-50 text-sky-700 border-l-2 border-sky-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                )}
              >
                <Icon className="w-4 h-4 mr-3 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p className="font-medium text-gray-700">{user?.firstName} {user?.lastName}</p>
          <p className="capitalize">{role.replace('_', ' ')}</p>
        </div>
      </div>
    </aside>
  );
}