'use client';

import React from 'react';

// Dummy AuthSessionProvider — NextAuth removed, using Supabase Auth
export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
