import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getAdminClient } from "@/lib/supabase-admin";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ user: null });
  }

  const admin = getAdminClient();
  const uid   = session.user.id;

  // 병렬로 두 쿼리 실행 (trial 컬럼은 migration 099 이후 존재 — 없으면 에러 무시)
  const [{ data: profile }, { data: trialRow, error: trialErr }] = await Promise.all([
    admin.from("profiles").select("plan, plan_expires_at, name, avatar_url").eq("id", uid).single(),
    admin.from("profiles").select("trial_ends_at, trial_converted").eq("id", uid).single(),
  ]);

  let trialEndsAt: string | null = null;
  let trialConverted = false;
  if (!trialErr && trialRow) {
    trialEndsAt    = trialRow.trial_ends_at ?? null;
    trialConverted = trialRow.trial_converted ?? false;
  }

  const now = Date.now();
  let trialDaysLeft: number | null = null;
  if (trialEndsAt) {
    const msLeft = new Date(trialEndsAt).getTime() - now;
    trialDaysLeft = msLeft > 0 ? Math.ceil(msLeft / 86_400_000) : 0;
  }

  return NextResponse.json({
    user: {
      id:        session.user.id,
      email:     session.user.email,
      name:      profile?.name ?? (session.user.user_metadata?.full_name as string | null) ?? null,
      avatarUrl: profile?.avatar_url ?? (session.user.user_metadata?.avatar_url as string | null) ?? null,
    },
    plan:           profile?.plan ?? null,
    planExpiresAt:  profile?.plan_expires_at ?? null,
    trialEndsAt,
    trialConverted,
    trialDaysLeft,
    onTrial: trialDaysLeft !== null && trialDaysLeft > 0 && !trialConverted,
  });
}
