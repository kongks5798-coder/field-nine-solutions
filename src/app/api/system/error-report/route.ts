import { NextResponse } from "next/server";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { slackNotify } from "@/core/integrations/slack";
import { linearCreateIssue } from "@/core/integrations/linear";

export const runtime = "edge";

type ErrorPayload = {
  message: string;
  stack?: string;
  url?: string;
  component?: string;
};

export async function POST(req: Request) {
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:error:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const body = (await req.json().catch(() => null)) as ErrorPayload | null;
  const ok =
    body &&
    typeof body.message === "string" &&
    body.message.length > 0 &&
    (body.stack === undefined || typeof body.stack === "string");
  if (!ok) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const text =
    `Error: ${body.message}\n` +
    (body.url ? `URL: ${body.url}\n` : "") +
    (body.component ? `Component: ${body.component}\n` : "") +
    (body.stack ? `Stack:\n${body.stack.slice(0, 2000)}` : "");

  await slackNotify(text);
  const teamId = process.env.LINEAR_TEAM_ID || "";
  if (teamId) {
    await linearCreateIssue({
      teamId,
      title: `Error: ${body.message.slice(0, 80)}`,
      description: text,
    });
  }
  return NextResponse.json({ ok: true });
}
