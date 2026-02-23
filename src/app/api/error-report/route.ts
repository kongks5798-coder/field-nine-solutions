import { NextRequest, NextResponse } from "next/server";
import log from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Log to server-side logger (will go to Vercel logs / Sentry)
    log.error("Client error reported", {
      type: body.type,
      message: body.message,
      stack: body.stack?.substring(0, 2000), // truncate long stacks
      url: body.url,
      ua: body.ua,
      ts: body.ts,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
