"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Settings,
  Menu,
  X
} from "lucide-react"
import { useState } from "react"
// import { useSession, signOut } from "next-auth/react"
import { useSession } from "@/components/providers/SessionProvider"
import { cn } from "@/lib/utils"
import Logo from "@/app/components/Logo"
import { DarkModeToggle } from "@/components/ui/dark-mode-toggle"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

/**
 * Sidebar Layout Component
 * 
 * This is the main navigation layout for the dashboard.
 * It provides:
 * - Left sidebar with menu items
 * - Responsive mobile menu
 * - Active route highlighting
 * - Professional dark-mode-ready design
 * 
 * Used in: Dashboard, Inventory, Orders, Settings pages
 * 
 * @example
 * <SidebarLayout>
 *   <YourPageContent />
 * </SidebarLayout>
 */

interface SidebarLayoutProps {
  children: React.ReactNode
  userName?: string
  userEmail?: string
}

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Inventory",
    href: "/dashboard/inventory",
    icon: Package,
  },
  {
    name: "Orders",
    href: "/dashboard/orders",
    icon: ShoppingCart,
  },
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

export default function SidebarLayout({ 
  children, 
  userName,
  userEmail
}: SidebarLayoutProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const sessionData = useSession()
  const session = sessionData?.user ? { user: sessionData.user } : null
  
  // NextAuth 세션에서 사용자 정보 가져오기 (우선순위)
  const displayName = userName || 
    session?.user?.user_metadata?.full_name || 
    session?.user?.user_metadata?.name || 
    session?.user?.email || 
    "User"
  const displayEmail = userEmail || session?.user?.email || ""

  return (
    <div className="min-h-screen bg-[#F9F9F7] dark:bg-[#0F0F0F] transition-colors">
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 bg-white dark:bg-[#1A1A1A] border-r border-[#E5E5E0] dark:border-[#2A2A2A] flex-col transition-colors">
          {/* Logo Section */}
          <div className="p-6 border-b border-[#E5E5E0] dark:border-[#2A2A2A]">
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <Logo size="md" animated={true} />
              <div>
                <h1 className="text-xl font-bold text-[#171717] dark:text-[#F5F5F5] group-hover:text-[#1A5D3F] dark:group-hover:text-[#2DD4BF] transition-colors">
                  Field Nine
                </h1>
                <p className="text-xs text-[#6B6B6B] dark:text-[#A3A3A3] mt-0.5">ERP System</p>
              </div>
            </Link>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-[#1A5D3F]/10 text-[#1A5D3F] font-medium"
                      : "text-[#171717] hover:bg-[#F5F5F5]"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* User Info Section */}
          <div className="p-4 border-t border-[#E5E5E0] dark:border-[#2A2A2A]">
            <div className="px-4 py-2 mb-3">
              <p className="text-sm font-medium text-[#171717] dark:text-[#F5F5F5]">{displayName}</p>
              {displayEmail && (
                <p className="text-xs text-[#6B6B6B] dark:text-[#A3A3A3] truncate">{displayEmail}</p>
              )}
            </div>
            <div className="px-4 py-2 space-y-2">
              <DarkModeToggle />
              {session && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Mock sign out
                    window.location.href = '/login';
                  }}
                  className="w-full border-[#E5E5E0] dark:border-[#2A2A2A] text-[#6B6B6B] dark:text-[#A3A3A3] hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A]"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  로그아웃
                </Button>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile Menu Button */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-[#1A1A1A] border-b border-[#E5E5E0] dark:border-[#2A2A2A] transition-colors">
          <div className="flex items-center justify-between p-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Logo size="sm" animated={false} />
              <span className="text-lg font-bold text-[#171717] dark:text-[#F5F5F5]">Field Nine</span>
            </Link>
            <div className="flex items-center gap-2">
              <DarkModeToggle />
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-[#171717] dark:text-[#F5F5F5] hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={cn(
            "md:hidden fixed top-16 left-0 bottom-0 w-64 bg-white dark:bg-[#1A1A1A] border-r border-[#E5E5E0] dark:border-[#2A2A2A] z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto",
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-[#1A5D3F]/10 text-[#1A5D3F] font-medium"
                      : "text-[#171717] hover:bg-[#F5F5F5]"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto md:ml-0">
          {/* Top Header */}
          <header className="sticky top-0 z-10 bg-white dark:bg-[#1A1A1A] border-b border-[#E5E5E0] dark:border-[#2A2A2A] px-4 sm:px-6 lg:px-8 py-4 md:py-6 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#171717] dark:text-[#F5F5F5]">
                  {pathname === "/dashboard" && "Dashboard"}
                  {pathname === "/dashboard/inventory" && "Inventory"}
                  {pathname === "/dashboard/orders" && "Orders"}
                  {pathname === "/dashboard/settings" && "Settings"}
                  {!pathname.startsWith("/dashboard") && "Field Nine"}
                </h2>
                {displayEmail && (
                  <p className="text-xs sm:text-sm text-[#6B6B6B] dark:text-[#A3A3A3] mt-1">{displayEmail}</p>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
