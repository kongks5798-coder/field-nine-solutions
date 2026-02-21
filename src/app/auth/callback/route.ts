import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  // Validate next param — only allow same-origin paths (prevent open redirect)
  const rawNext = requestUrl.searchParams.get("next") ?? "/workspace";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("://")
    ? rawNext
    : "/workspace";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.session) {
      // Auto-create profile row for new users (upsert — safe to call every login)
      const uid = data.session.user.id;
      const email = data.session.user.email ?? "";
      const name = data.session.user.user_metadata?.full_name ?? email.split("@")[0] ?? "사용자";
      const adminSb = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => [], setAll: () => {} } }
      );
      const { data: profileData } = await adminSb.from("profiles").upsert(
        { id: uid, email, name, plan: "starter", created_at: new Date().toISOString() },
        { onConflict: "id", ignoreDuplicates: true }
      ).select("id");
      // 신규 가입자에게만 웰컴 이메일 발송 (ignoreDuplicates=true → 기존 행은 빈 배열)
      if (profileData && profileData.length > 0) {
        sendWelcomeEmail(email, name).catch(() => {});
      }
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // Return to login with error
  return NextResponse.redirect(
    new URL("/login?error=auth_callback_failed", requestUrl.origin)
  );
}
