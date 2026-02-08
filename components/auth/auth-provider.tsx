/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 87: UNIFIED MASTER AUTHORITY - AUTH PROVIDER
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * kongks5798@gmail.com = SUPER_ADMIN (regardless of OAuth provider)
 * Auto-upgrade role on login
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useAuthStore } from '@/store/auth-store';
import { isEmperor, getRoleFromEmail } from '@/lib/auth/emperor-whitelist';

interface AuthProviderProps {
  children: React.ReactNode;
}

// 보호되지 않는 경로 (로그인 없이 접근 가능)
const PUBLIC_PATHS = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/features',
  '/demo',
  // NEXUS 경로 - 로그인 없이 접근 가능 (KAUS 구매/거래는 별도 인증)
  '/nexus',
  '/nexus/energy',
  '/nexus/exchange',
  '/nexus/market',
  '/nexus/profile',
  '/nexus/membership',
  '/nexus/referral',
  // 기타
  '/offline',
  '/landing',
];

// 경로가 public인지 확인
function isPublicPath(pathname: string): boolean {
  // locale prefix 제거 (예: /ko/auth/login -> /auth/login)
  const pathWithoutLocale = pathname.replace(/^\/(ko|en|ja|zh)/, '') || '/';
  return PUBLIC_PATHS.some((path) => pathWithoutLocale === path || pathWithoutLocale.startsWith(path + '/'));
}

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    setSession,
    setUser,
    setUserProfile,
    setWallet,
    setInitialized,
    logout,
    isAuthenticated,
    isInitialized,
  } = useAuthStore();

  // Initialize auth state from Supabase
  const initializeAuth = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setSession(session);
        setUser(session.user);

        // PHASE 87: Auto-detect Emperor and set role
        const userEmail = session.user.email;
        const role = getRoleFromEmail(userEmail);
        const isAdmin = isEmperor(userEmail);

        console.log(`[Auth] Session restored: ${userEmail}, Role: ${role}, Emperor: ${isAdmin}`);

        // Set user profile from session data with role
        setUserProfile({
          id: session.user.id,
          userId: session.user.id,
          email: session.user.email,
          name: session.user.user_metadata?.name,
          phone: session.user.user_metadata?.phone,
          avatarUrl: session.user.user_metadata?.avatar_url,
          kycStatus: 'not_submitted',
          kycVerifiedAt: null,
          role, // PHASE 87: Unified role
        });

        // Initialize wallet (will be synced from DB in production)
        setWallet({
          balance: 0,
          currency: 'KRW',
          hasVirtualCard: false,
        });
      } else {
        logout();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      logout();
    } finally {
      setInitialized(true);
    }
  }, [setSession, setUser, setUserProfile, setWallet, setInitialized, logout]);

  // Listen for auth state changes
  useEffect(() => {
    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        console.log('Auth state changed:', event);

        if (event === 'SIGNED_IN' && session?.user) {
          setSession(session);
          setUser(session.user);

          // PHASE 87: Auto-detect Emperor and set role
          const userEmail = session.user.email;
          const role = getRoleFromEmail(userEmail);
          const isAdmin = isEmperor(userEmail);

          console.log(`[Auth] User signed in: ${userEmail}, Role: ${role}, Emperor: ${isAdmin}`);

          setUserProfile({
            id: session.user.id,
            userId: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name,
            phone: session.user.user_metadata?.phone,
            avatarUrl: session.user.user_metadata?.avatar_url,
            kycStatus: 'not_submitted',
            kycVerifiedAt: null,
            role, // PHASE 87: Unified role
          });
          setWallet({
            balance: 0,
            currency: 'KRW',
            hasVirtualCard: false,
          });
        } else if (event === 'SIGNED_OUT') {
          logout();
        } else if (event === 'TOKEN_REFRESHED' && session) {
          setSession(session);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [initializeAuth, setSession, setUser, setUserProfile, setWallet, logout]);

  // Protected route check
  useEffect(() => {
    if (!isInitialized) return;

    const isPublic = isPublicPath(pathname);

    // If not authenticated and trying to access protected route, redirect to login
    if (!isAuthenticated && !isPublic) {
      const locale = pathname.split('/')[1] || 'ko';
      router.push(`/${locale}/auth/login`);
    }
  }, [isInitialized, isAuthenticated, pathname, router]);

  // Show nothing while initializing to prevent flash
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-[#0A0A0F] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
