'use client';

import { Bell, User, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

interface DashboardHeaderProps {
  user: any; // Supabase User 객체
  notificationCount?: number;
}

/**
 * Nexus Agent Dashboard Header
 * 2026 Agentic Workflow: Minimalist header with user context and notifications
 */
export default function DashboardHeader({ 
  user,
  notificationCount = 3 
}: DashboardHeaderProps) {
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'User';
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-foreground rounded-xl flex items-center justify-center">
              <span className="text-background font-bold text-lg">N</span>
            </div>
            <span className="text-2xl font-bold text-foreground tracking-tight">
              NEXUS
            </span>
          </div>

          {/* Right Side: Notifications & Profile */}
          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-xl"
            >
              <Bell className="w-5 h-5 text-foreground" />
              {notificationCount > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center"
                >
                  <span className="text-xs font-bold text-destructive-foreground">
                    {notificationCount}
                  </span>
                </motion.div>
              )}
            </Button>

            {/* User Profile */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <User className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">Agent Active</p>
              </div>
            </div>

            {/* Settings */}
            <Button variant="ghost" size="icon" className="rounded-xl">
              <Settings className="w-5 h-5 text-foreground" />
            </Button>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
