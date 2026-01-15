'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Mail,
  Activity,
  Wifi,
  WifiOff,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/panopticon', icon: LayoutDashboard },
  { label: 'Musinsa Live', href: '/panopticon/musinsa', icon: ShoppingBag },
  { label: 'Inventory', href: '/panopticon/inventory', icon: Package },
  { label: 'Google Workspace', href: '/panopticon/workspace', icon: Mail },
];

interface SystemStatus {
  service: string;
  status: 'online' | 'offline' | 'warning';
}

const systemStatuses: SystemStatus[] = [
  { service: 'API Gateway', status: 'online' },
  { service: 'Database', status: 'online' },
  { service: 'Cache', status: 'online' },
];

export function PanopticonSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[280px] h-screen bg-background border-r border-muted flex flex-col">
      {/* Logo Section */}
      <div className="px-8 py-8">
        <Link href="/panopticon" className="block">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            FIELD NINE<span className="text-muted-foreground">.</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 tracking-wide">
            PANOPTICON
          </p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                    transition-all duration-200 ease-out
                    ${
                      isActive
                        ? 'bg-foreground text-background'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* System Status */}
      <div className="px-6 py-6 border-t border-muted">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            System Status
          </span>
        </div>
        <ul className="space-y-2">
          {systemStatuses.map((system) => (
            <li key={system.service} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{system.service}</span>
              <div className="flex items-center gap-2">
                {system.status === 'online' ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <Wifi className="w-3 h-3 text-emerald-500" />
                  </>
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-red-500" />
                    <WifiOff className="w-3 h-3 text-red-500" />
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* Version Info */}
        <div className="mt-6 pt-4 border-t border-muted">
          <p className="text-[10px] text-muted-foreground/60 tracking-wider">
            v1.0.0 • Last sync: Just now
          </p>
        </div>
      </div>
    </aside>
  );
}
