/**
 * ONE-TIME bootstrap endpoint — admin role 컬럼 추가 + 지정 유저를 admin으로 설정
 * BOOTSTRAP_SECRET 헤더가 맞아야만 실행됨.
 * 완료 후 이 파일을 삭제하거나 BOOTSTRAP_SECRET 환경변수를 제거하면 비활성화됨.
 */
import { NextRequest, NextResponse } from "next/server";
import { getAdminClient } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-bootstrap-secret");
  const envSecret = process.env.BOOTSTRAP_SECRET;
  if (!envSecret || secret !== envSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await req.json().catch(() => ({}));
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const admin = getAdminClient();

  // 1. 유저 찾기
  const { data: { users }, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });

  const user = users.find(u => u.email === email);
  if (!user) return NextResponse.json({ error: `User not found: ${email}` }, { status: 404 });

  // 2. profiles 컬럼 확인
  const { data: sample } = await admin.from("profiles").select("*").limit(1);
  const cols = sample && sample[0] ? Object.keys(sample[0]) : [];

  const results: string[] = [`user found: ${user.id}`];

  // 3. role 컬럼 없으면 → user_metadata에 role=admin 저장 (대체 방법)
  if (!cols.includes("role")) {
    // auth.users의 user_metadata에 role 저장
    const { error: metaErr } = await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { role: "admin" },
      app_metadata:  { role: "admin" },
    });
    if (metaErr) return NextResponse.json({ error: metaErr.message }, { status: 500 });
    results.push("app_metadata.role = admin 설정 완료");
  } else {
    const { error: updateErr } = await admin.from("profiles")
      .upsert({ user_id: user.id, email, role: "admin" }, { onConflict: "user_id" });
    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });
    results.push("profiles.role = admin 설정 완료");
  }

  return NextResponse.json({ ok: true, results });
}
