import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { sendWelcomeEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  // code 파라미터 없으면 즉시 400
  if (!code) {
    return NextResponse.json({ error: 'Missing code parameter' }, { status: 400 });
  }

  // Validate next param — only allow same-origin paths (prevent open redirect)
  const rawNext = requestUrl.searchParams.get("next") ?? "/workspace";
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") && !rawNext.includes("://")
    ? rawNext
    : "/workspace";

  try {
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
  } catch {
    // 네트워크 오류 등 예외 발생 시 401
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }

  // 코드가 유효하지 않음 — 401 반환 (브라우저 OAuth 흐름 외 API 테스트 대응)
  return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 });
}
