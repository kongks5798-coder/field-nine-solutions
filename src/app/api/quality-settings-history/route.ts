import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { admin } from "@/utils/supabase/admin";

function serverClient(req: NextRequest) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} } },
  );
}

/** GET /api/quality-settings-history */
export async function GET(req: NextRequest) {
  const supabase = serverClient(req);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const limit = Number(req.nextUrl.searchParams.get("limit") ?? "100");
    const offset = Number(req.nextUrl.searchParams.get("offset") ?? "0");
    const settingKey = req.nextUrl.searchParams.get("key");

    let query = admin
      .from("quality_settings_history")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (settingKey) {
      query = query.eq("setting_key", settingKey);
    }

    const { data: logs, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({ logs: logs ?? [], total: count ?? 0 });
  } catch {
    return NextResponse.json({ logs: [], total: 0 });
  }
}

/** POST /api/quality-settings-history */
export async function POST(req: NextRequest) {
  const supabase = serverClient(req);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const { setting_key, old_value, new_value } = body as {
      setting_key?: string;
      old_value?: unknown;
      new_value?: unknown;
    };

    if (!setting_key) {
      return NextResponse.json(
        { error: "setting_key는 필수입니다." },
        { status: 400 },
      );
    }

    const { data, error } = await admin
      .from("quality_settings_history")
      .insert({
        setting_key,
        old_value: old_value ?? null,
        new_value: new_value ?? null,
        changed_by: session.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({
      message: "이력이 저장되었습니다.",
      record: data,
    });
  } catch {
    return NextResponse.json(
      { message: "이력 저장 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
