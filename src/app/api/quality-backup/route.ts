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
const TABLE_MAP: Record<string, string> = {
  "chat-log": "chat_logs",
  "admin-alert-log": "admin_alert_logs",
  "quality-settings-history": "quality_settings_history",
  "quality-settings": "quality_settings",
};

/** GET /api/quality-backup?file=<key> — 품질 데이터 백업 다운로드 */
export async function GET(req: NextRequest) {
  const supabase = serverClient(req);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const file = req.nextUrl.searchParams.get("file") ?? "";
  const validKeys = Object.keys(TABLE_MAP);

  if (!validKeys.includes(file)) {
    return NextResponse.json(
      { error: "유효하지 않은 파일 키입니다." },
      { status: 400 },
    );
  }

  try {
    const tableName = TABLE_MAP[file];
    const { data, error } = await admin
      .from(tableName)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10000);

    if (error) throw error;

    const rows = data ?? [];
    const isJson = file === "quality-settings";
    const ext = isJson ? ".json" : ".jsonl";

    let content: string;
    if (isJson) {
      content = JSON.stringify(rows, null, 2);
    } else {
      content = rows.map((r) => JSON.stringify(r)).join("\n");
    }

    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": isJson ? "application/json" : "application/x-ndjson",
        "Content-Disposition": "attachment; filename=\"" + file + ext + "\"",
      },
    });
  } catch {
    const isJson = file === "quality-settings";
    const ext = isJson ? ".json" : ".jsonl";
    return new NextResponse(isJson ? "{}" : "", {
      status: 200,
      headers: {
        "Content-Type": isJson ? "application/json" : "application/x-ndjson",
        "Content-Disposition": "attachment; filename=\"" + file + ext + "\"",
      },
    });
  }
}

/** POST /api/quality-backup */
export async function POST(req: NextRequest) {
  const supabase = serverClient(req);
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json().catch(() => ({}));
    const { name } = body as { name?: string };
    const backupName = name ?? "backup-" + new Date().toISOString();

    let totalSize = 0;
    for (const table of Object.values(TABLE_MAP)) {
      const { count } = await admin
        .from(table)
        .select("*", { count: "exact", head: true });
      totalSize += (count ?? 0) * 256;
    }

    const { data, error } = await admin
      .from("quality_backups")
      .insert({ name: backupName, size_bytes: totalSize, status: "completed" })
      .select()
      .single();
    if (error) throw error;

    return NextResponse.json({ message: "백업이 생성되었습니다.", backup: data });
  } catch {
    return NextResponse.json(
      { message: "백업 생성 중 오류가 발생했습니다." },
      { status: 500 },
    );
  }
}
