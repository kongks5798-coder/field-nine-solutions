import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/core/adminAuth";
import { getAdminClient } from "@/lib/supabase-admin";
import { checkLimit, headersFor } from "@/core/rateLimit";
import { Resend } from "resend";
import { z } from "zod";

const BATCH_SIZE = 50;
const MAX_RECIPIENTS = 500;

const BodySchema = z.object({
  subject: z.string().min(1).max(200),
  html:    z.string().min(1).max(500_000),
  target:  z.enum(["all", "pro", "team", "free"]),
});

export async function POST(req: NextRequest) {
  // 관리자 인증
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;

  // 레이트 리밋: 1시간에 3회
  const rl = checkLimit("admin-newsletter", 3, 60 * 60 * 1000);
  if (!rl.ok) {
    const res = NextResponse.json({ error: "Too Many Requests — 1시간에 최대 3회" }, { status: 429 });
    Object.entries(headersFor(rl)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }

  // 요청 바디 파싱 & 검증
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", issues: parsed.error.issues }, { status: 400 });
  }
  const { subject, html, target } = parsed.data;

  // Resend 클라이언트
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  // 수신자 조회
  const admin = getAdminClient();
  let query = admin
    .from("profiles")
    .select("email, plan")
    .not("email", "is", null)
    .limit(MAX_RECIPIENTS + 1); // +1 for limit check

  if (target === "free") {
    query = query.is("plan", null);
  } else if (target !== "all") {
    query = query.eq("plan", target);
  }

  const { data: profiles, error: dbError } = await query;
  if (dbError) {
    return NextResponse.json({ error: "DB 조회 실패", detail: dbError.message }, { status: 500 });
  }

  const allEmails: string[] = (profiles ?? [])
    .map((p: { email: string | null; plan: string | null }) => p.email)
    .filter((e): e is string => typeof e === "string" && e.length > 0);

  if (allEmails.length > MAX_RECIPIENTS) {
    return NextResponse.json(
      { error: `수신자가 ${MAX_RECIPIENTS}명을 초과합니다 (현재 ${allEmails.length}명). 타겟을 좁혀주세요.` },
      { status: 400 }
    );
  }

  if (allEmails.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, failed: 0 });
  }

  // 배치 전송 (50명씩)
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < allEmails.length; i += BATCH_SIZE) {
    const batch = allEmails.slice(i, i + BATCH_SIZE);
    try {
      const { error: sendError } = await resend.batch.send(
        batch.map((email) => ({
          from: "Dalkak <noreply@fieldnine.io>",
          to: email,
          subject,
          html,
        }))
      );
      if (sendError) {
        failed += batch.length;
      } else {
        sent += batch.length;
      }
    } catch {
      failed += batch.length;
    }
  }

  return NextResponse.json({ ok: true, sent, failed });
}
