'use client';

import { useState, useEffect } from 'react';
import { User, Bell, Settings, Search } from 'lucide-react';

function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return date.toLocaleDateString('en-US', options);
}

export function PanopticonHeader() {
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    setCurrentDate(formatDate(new Date()));
  }, []);

  return (
    <header className="h-16 border-b border-muted bg-background/80 backdrop-blur-sm flex items-center justify-between px-8">
      {/* Left: Date */}
      <div className="flex items-center gap-6">
        <time className="text-sm text-muted-foreground" dateTime={new Date().toISOString()}>
          {currentDate}
        </time>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Notifications */}
        <button
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Settings */}
        <button
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>

        {/* User Profile */}
        <div className="ml-2 flex items-center gap-3 pl-4 border-l border-muted">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground">Boss</p>
            <p className="text-xs text-muted-foreground">CEO</p>
          </div>
          <button
            className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center"
            aria-label="User profile"
          >
            <User className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
