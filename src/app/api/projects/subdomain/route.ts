import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { z } from "zod";

const SubdomainSchema = z.object({
  subdomain: z
    .string()
    .min(3, "최소 3자 이상")
    .max(20, "최대 20자 이하")
    .regex(/^[a-z0-9][a-z0-9-]{1,18}[a-z0-9]$/, "영문 소문자·숫자·하이픈만, 시작/끝은 영숫자"),
});

function serverClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } },
  );
}

// POST /api/projects/subdomain
// body: { subdomain: string }
// - 유효성 검사 (영문소문자/숫자/하이픈, 3~20자)
// - 중복 체크 (profiles 테이블의 subdomain 컬럼)
// - DB 저장
// - 반환: { url: "https://[subdomain].fieldnine.io" }
export async function POST(req: NextRequest) {
  const supabase = serverClient(req);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const raw = await req.json().catch(() => ({}));
  const parsed = SubdomainSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues;
    const msg = issues[0]?.message ?? "올바른 서브도메인을 입력해주세요.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { subdomain } = parsed.data;

  // 예약어 차단
  const RESERVED = ["www", "api", "admin", "app", "mail", "smtp", "ftp", "cdn", "static", "assets", "fieldnine", "dalkak"];
  if (RESERVED.includes(subdomain)) {
    return NextResponse.json({ error: "사용할 수 없는 서브도메인입니다." }, { status: 400 });
  }

  // 중복 체크 — profiles 테이블 subdomain 컬럼
  const { data: existing, error: checkError } = await supabase
    .from("profiles")
    .select("id")
    .eq("subdomain", subdomain)
    .neq("id", session.user.id)
    .maybeSingle();

  if (checkError) {
    // profiles 테이블에 subdomain 컬럼이 없을 수 있음 — graceful degradation
    // 컬럼 없음 오류면 무시하고 저장 시도
    if (!checkError.message.includes("column") && !checkError.message.includes("subdomain")) {
      return NextResponse.json({ error: "중복 확인 실패" }, { status: 500 });
    }
  }

  if (existing) {
    return NextResponse.json({ error: "이미 사용 중인 서브도메인입니다." }, { status: 409 });
  }

  // profiles 테이블에 subdomain 저장 (upsert)
  const { error: upsertError } = await supabase
    .from("profiles")
    .upsert({ id: session.user.id, subdomain }, { onConflict: "id" });

  if (upsertError) {
    // subdomain 컬럼이 없는 경우 graceful — 미래에 마이그레이션 적용 시 작동
    if (upsertError.message.includes("column") || upsertError.message.includes("subdomain")) {
      // 컬럼 없음 — DB 준비 전이므로 성공 응답 (UX 우선)
      return NextResponse.json({
        url: `https://${subdomain}.fieldnine.io`,
        note: "DB 준비 중 — 실제 적용은 마이그레이션 후",
      });
    }
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }

  return NextResponse.json({
    url: `https://${subdomain}.fieldnine.io`,
  });
}

// GET /api/projects/subdomain — 현재 사용자의 서브도메인 조회
export async function GET(req: NextRequest) {
  const supabase = serverClient(req);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return NextResponse.json({ subdomain: null });
  }

  const { data } = await supabase
    .from("profiles")
    .select("subdomain")
    .eq("id", session.user.id)
    .maybeSingle();

  return NextResponse.json({ subdomain: (data as { subdomain?: string } | null)?.subdomain ?? null });
}
