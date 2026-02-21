/**
 * FieldNine Auth Utility
 * - Real Supabase auth when NEXT_PUBLIC_SUPABASE_URL is configured
 * - localStorage fallback for development without credentials
 */

import { createBrowserClient } from "@supabase/ssr";

// ─── Check if Supabase is configured ─────────────────────────────────────────

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL !== "https://placeholder.supabase.co"
  );
}

export function createAuthClient() {
  if (!isSupabaseConfigured()) return null;
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt?: string;
};

export type AuthResult =
  | { ok: true; user: AuthUser; needsVerification?: boolean }
  | { ok: false; error: string };

// ─── Local user store (dev fallback) ─────────────────────────────────────────

interface LocalUser {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
}

function getLocalUsers(): LocalUser[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("fn_users") || "[]"); } catch { return []; }
}

function saveLocalUsers(users: LocalUser[]) {
  localStorage.setItem("fn_users", JSON.stringify(users));
}

function setLocalSession(user: AuthUser) {
  localStorage.setItem("fn_user", JSON.stringify(user));
}

function clearLocalSession() {
  localStorage.removeItem("fn_user");
}

// ─── Sign Up ──────────────────────────────────────────────────────────────────

export async function authSignUp(
  name: string,
  email: string,
  password: string
): Promise<AuthResult> {
  const supabase = createAuthClient();

  if (supabase) {
    // Real Supabase auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) return { ok: false, error: mapSupabaseError(error.message) };
    const user: AuthUser = {
      id: data.user?.id || "",
      name,
      email,
      createdAt: new Date().toISOString(),
    };
    // If email confirmation required
    if (!data.session) {
      return { ok: true, user, needsVerification: true };
    }
    setLocalSession(user);
    return { ok: true, user };
  }

  // Fallback: localStorage
  const users = getLocalUsers();
  if (users.find((u) => u.email === email)) {
    return { ok: false, error: "이미 가입된 이메일입니다. 로그인해주세요." };
  }
  const newUser: LocalUser = {
    id: `local_${Date.now()}`,
    name,
    email,
    password,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  saveLocalUsers(users);
  const authUser: AuthUser = { id: newUser.id, name, email, createdAt: newUser.createdAt };
  setLocalSession(authUser);
  return { ok: true, user: authUser };
}

// ─── Sign In ──────────────────────────────────────────────────────────────────

export async function authSignIn(
  email: string,
  password: string
): Promise<AuthResult> {
  const supabase = createAuthClient();

  if (supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { ok: false, error: mapSupabaseError(error.message) };
    const user: AuthUser = {
      id: data.user.id,
      name: data.user.user_metadata?.name || email.split("@")[0],
      email: data.user.email || email,
      avatarUrl: data.user.user_metadata?.avatar_url,
    };
    setLocalSession(user);
    return { ok: true, user };
  }

  // Fallback: localStorage
  const users = getLocalUsers();
  const found = users.find((u) => u.email === email);
  if (!found) {
    // Dev mode: auto-create account
    const newUser: LocalUser = {
      id: `local_${Date.now()}`,
      name: email.split("@")[0],
      email,
      password,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    saveLocalUsers(users);
    const authUser: AuthUser = { id: newUser.id, name: newUser.name, email };
    setLocalSession(authUser);
    return { ok: true, user: authUser };
  }
  if (found.password !== password) {
    return { ok: false, error: "비밀번호가 올바르지 않습니다." };
  }
  const authUser: AuthUser = { id: found.id, name: found.name, email };
  setLocalSession(authUser);
  return { ok: true, user: authUser };
}

// ─── Sign Out ─────────────────────────────────────────────────────────────────

export async function authSignOut(): Promise<void> {
  const supabase = createAuthClient();
  if (supabase) await supabase.auth.signOut();
  clearLocalSession();
}

// ─── Get current user ─────────────────────────────────────────────────────────

export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = createAuthClient();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return null;
    return {
      id: data.user.id,
      name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "사용자",
      email: data.user.email || "",
      avatarUrl: data.user.user_metadata?.avatar_url,
    };
  }
  // Fallback
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("fn_user");
  if (!stored) return null;
  try { return JSON.parse(stored); } catch { return null; }
}

// ─── OAuth (GitHub, Google) ───────────────────────────────────────────────────

export async function authSignInWithGitHub(): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAuthClient();
  if (!supabase) return { ok: false, error: "Supabase 미설정. .env.local에 NEXT_PUBLIC_SUPABASE_URL을 추가하세요." };
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) return { ok: false, error: mapSupabaseError(error.message) };
  return { ok: true };
}

export async function authSignInWithGoogle(): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAuthClient();
  if (!supabase) return { ok: false, error: "Supabase 미설정." };
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) return { ok: false, error: mapSupabaseError(error.message) };
  return { ok: true };
}

// ─── Magic Link (OTP / passwordless) ─────────────────────────────────────────

export async function authSignInWithMagicLink(email: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAuthClient();
  if (!supabase) return { ok: false, error: "Supabase 미설정. 이메일/비밀번호 로그인을 사용하세요." };
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
  });
  if (error) return { ok: false, error: mapSupabaseError(error.message) };
  return { ok: true };
}

// ─── Forgot password ──────────────────────────────────────────────────────────

export async function authForgotPassword(email: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAuthClient();
  if (supabase) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    if (error) return { ok: false, error: mapSupabaseError(error.message) };
    return { ok: true };
  }
  // Dev: always succeed
  return { ok: true };
}

// ─── Map Supabase errors to Korean ────────────────────────────────────────────

function mapSupabaseError(msg: string): string {
  if (msg.includes("Invalid login credentials")) return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if (msg.includes("Email not confirmed")) return "이메일 인증이 필요합니다. 받은 편지함을 확인해주세요.";
  if (msg.includes("User already registered")) return "이미 가입된 이메일입니다. 로그인해주세요.";
  if (msg.includes("Password should be")) return "비밀번호는 6자 이상이어야 합니다.";
  if (msg.includes("rate limit")) return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
  if (msg.includes("network")) return "네트워크 오류가 발생했습니다. 다시 시도해주세요.";
  return msg;
}
