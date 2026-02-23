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

const DEFAULT_SETTINGS: Record<string, unknown> = {
  autoEval: false,
  threshold: 0.7,
  model: "gpt-4o-mini",
  notifyThreshold: 50,
  alertInterval: 10,
};

/** GET /api/quality-settings */
export async function GET(req: NextRequest) {
  const supabase = serverClient(req);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data: rows, error } = await admin
      .from("quality_settings")
      .select("key, value")
      .order("key");

    if (error) throw error;

    const merged: Record<string, unknown> = { ...DEFAULT_SETTINGS };
    for (const row of rows ?? []) {
      merged[row.key] = row.value;
    }

    return NextResponse.json({ settings: merged, ...merged });
  } catch {
    return NextResponse.json({ settings: DEFAULT_SETTINGS, ...DEFAULT_SETTINGS });
  }
}

/** POST /api/quality-settings */
export async function POST(req: NextRequest) {
  const supabase = serverClient(req);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const entries = Object.entries(body as Record<string, unknown>);

    for (const [key, value] of entries) {
      await admin
        .from("quality_settings")
        .upsert(
          { key, value: JSON.parse(JSON.stringify(value)), updated_at: new Date().toISOString() },
          { onConflict: "key" },
        );
    }

    return NextResponse.json({ message: "설정이 저장되었습니다." });
  } catch {
    return NextResponse.json(
      { message: "설정 저장 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}

/** PUT /api/quality-settings */
export async function PUT(req: NextRequest) {
  const supabase = serverClient(req);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const entries = Object.entries(body as Record<string, unknown>);

    for (const [key, value] of entries) {
      await admin
        .from("quality_settings")
        .upsert(
          { key, value: JSON.parse(JSON.stringify(value)), updated_at: new Date().toISOString() },
          { onConflict: "key" },
        );
    }

    return NextResponse.json({ message: "설정이 저장되었습니다." });
  } catch {
    return NextResponse.json(
      { message: "설정 저장 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
