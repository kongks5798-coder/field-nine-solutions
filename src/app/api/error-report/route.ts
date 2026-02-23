import { NextRequest, NextResponse } from "next/server";
import log from "@/lib/logger";
import { alertIfNeeded } from "@/lib/alert-slack";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const context = {
      type: body.type,
      message: body.message,
      stack: body.stack?.substring(0, 2000), // truncate long stacks
      url: body.url,
      ua: body.ua,
      ts: body.ts,
    };

    // Log to server-side logger (will go to Vercel logs / Sentry)
    log.error("Client error reported", context);

    // 심각도 분류 후 Slack 알림 (critical/error 등급만)
    const classified = await alertIfNeeded(
      body.message ?? "Unknown client error",
      context,
    );

    return NextResponse.json({ ok: true, severity: classified.severity });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
