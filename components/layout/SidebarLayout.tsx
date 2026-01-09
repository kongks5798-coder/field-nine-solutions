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
import { cn } from "@/lib/utils"
import Logo from "@/app/components/Logo"

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
  userName = "User",
  userEmail = ""
}: SidebarLayoutProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#F9F9F7]">
      <div className="flex h-screen overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 bg-white border-r border-[#E5E5E0] flex-col">
          {/* Logo Section */}
          <div className="p-6 border-b border-[#E5E5E0]">
            <Link href="/dashboard" className="flex items-center space-x-3 group">
              <Logo size="md" animated={true} />
              <div>
                <h1 className="text-xl font-bold text-[#171717] group-hover:text-[#1A5D3F] transition-colors">
                  Field Nine
                </h1>
                <p className="text-xs text-[#6B6B6B] mt-0.5">ERP System</p>
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
          <div className="p-4 border-t border-[#E5E5E0]">
            <div className="px-4 py-2">
              <p className="text-sm font-medium text-[#171717]">{userName}</p>
              {userEmail && (
                <p className="text-xs text-[#6B6B6B] truncate">{userEmail}</p>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile Menu Button */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E5E5E0]">
          <div className="flex items-center justify-between p-4">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Logo size="sm" animated={false} />
              <span className="text-lg font-bold text-[#171717]">Field Nine</span>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#171717] hover:bg-[#F5F5F5] rounded-lg"
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
            "md:hidden fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-[#E5E5E0] z-50 transform transition-transform duration-300 ease-in-out overflow-y-auto",
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
          <header className="sticky top-0 z-10 bg-white border-b border-[#E5E5E0] px-4 sm:px-6 lg:px-8 py-4 md:py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#171717]">
                  {pathname === "/dashboard" && "Dashboard"}
                  {pathname === "/dashboard/inventory" && "Inventory"}
                  {pathname === "/dashboard/orders" && "Orders"}
                  {pathname === "/dashboard/settings" && "Settings"}
                  {!pathname.startsWith("/dashboard") && "Field Nine"}
                </h2>
                {userEmail && (
                  <p className="text-xs sm:text-sm text-[#6B6B6B] mt-1">{userEmail}</p>
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
