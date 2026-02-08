/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 84: UNIFIED MASTER AUTHORITY - AUTH PROVIDER
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Global authentication state with Emperor detection
 * - Checks Supabase session on mount
 * - Auto-detects Emperor by email
 * - Provides imperial vault access state
 * - Works with any OAuth provider (Google, Kakao)
 */

'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { isEmperor, getRoleFromEmail, UserRole, hasAdminAccess } from '@/lib/auth/emperor-whitelist';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface AuthUser {
  id: string;
  email: string | null;
  role: UserRole;
  provider?: string;
  lastSignIn?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isEmperor: boolean;
  hasAdminAccess: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════════════════════

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  isEmperor: false,
  hasAdminAccess: false,
  refresh: async () => {},
  signOut: async () => {},
});

// ═══════════════════════════════════════════════════════════════════════════════
// PROVIDER
// ═══════════════════════════════════════════════════════════════════════════════

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Create Supabase client
  const getSupabase = useCallback(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return null;
    }

    return createBrowserClient(supabaseUrl, supabaseKey);
  }, []);

  // Fetch session and determine role
  const fetchSession = useCallback(async () => {
    setIsLoading(true);

    try {
      const supabase = getSupabase();
      if (!supabase) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      const email = session.user.email || null;
      const role = getRoleFromEmail(email);

      setUser({
        id: session.user.id,
        email,
        role,
        provider: session.user.app_metadata?.provider,
        lastSignIn: session.user.last_sign_in_at,
      });

      // PHASE 84: Auto-upgrade Emperor profile to admin role
      if (role === 'EMPEROR' && email) {
        try {
          await fetch('/api/auth/upgrade-role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, role: 'admin' }),
          });
        } catch (e) {
          // Silently fail - profile upgrade is best effort
          console.log('[Auth] Profile upgrade skipped');
        }
      }
    } catch (error) {
      console.error('[Auth] Session fetch error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [getSupabase]);

  // Sign out
  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
  }, [getSupabase]);

  // Initial load and auth state listener
  useEffect(() => {
    fetchSession();

    const supabase = getSupabase();
    if (!supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await fetchSession();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchSession, getSupabase]);

  // Computed values
  const isAuthenticated = user !== null;
  const userIsEmperor = user ? isEmperor(user.email) : false;
  const userHasAdminAccess = user ? hasAdminAccess(user.role) : false;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        isEmperor: userIsEmperor,
        hasAdminAccess: userHasAdminAccess,
        refresh: fetchSession,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HOOK
// ═══════════════════════════════════════════════════════════════════════════════

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Convenience hooks
export function useIsEmperor() {
  const { isEmperor } = useAuth();
  return isEmperor;
}

export function useHasAdminAccess() {
  const { hasAdminAccess } = useAuth();
  return hasAdminAccess;
}

export default AuthProvider;
