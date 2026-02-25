import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { z } from 'zod';
import { SITE_URL } from '@/lib/constants';

function serverClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } }
  );
}

function toSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
  // crypto 기반 4바이트 랜덤 suffix (충돌 안전)
  const buf = new Uint8Array(4);
  crypto.getRandomValues(buf);
  const suffix = Array.from(buf).map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 6);
  return `${base}-${suffix}`;
}

const PublishSchema = z.object({
  projectId: z.string().max(100).optional(),
  name:      z.string().min(1).max(100),
  html:      z.string().min(1).max(2_000_000),
});

// POST /api/projects/publish
// Body: { projectId, name, html }
// Returns: { slug, url }
export async function POST(req: NextRequest) {
  // CSRF protection for publish operations
  const { verifyCsrf } = await import("@/lib/csrf");
  const csrfError = verifyCsrf(req);
  if (csrfError) return csrfError;

  const supabase = serverClient(req);
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Size guard (5MB max)
  const contentLength = parseInt(req.headers.get("content-length") ?? "0");
  if (contentLength > 5_000_000) {
    return NextResponse.json({ error: "HTML too large (max 5MB)" }, { status: 413 });
  }

  const publishParsed = PublishSchema.safeParse(await req.json().catch(() => ({})));
  if (!publishParsed.success) {
    return NextResponse.json({ error: publishParsed.error.issues[0]?.message ?? 'Invalid request' }, { status: 400 });
  }
  const { projectId, name, html } = publishParsed.data;

  // projectId ownership 검증 — 다른 사용자의 프로젝트로 배포 불가
  if (projectId) {
    const { data: ownedProject } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", session.user.id)
      .single();
    if (!ownedProject) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const appUrl = SITE_URL;

  // 슬러그 충돌 시 최대 5번 재시도 (23505 = unique constraint violation)
  let slug = '';
  let lastError: { code?: string } | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    slug = toSlug(name);
    const { error } = await supabase.from("published_apps").insert({
      slug,
      user_id: session.user.id,
      project_id: projectId ?? null,
      name,
      html,
      views: 0,
      updated_at: new Date().toISOString(),
    });
    if (!error) { lastError = null; break; }
    if (error.code !== '23505') { lastError = error; break; } // 충돌 외 에러는 즉시 실패
    lastError = error;
  }

  if (lastError) return NextResponse.json({ error: "배포에 실패했습니다." }, { status: 500 });

  return NextResponse.json({ slug, url: `${appUrl}/p/${slug}` });
}
