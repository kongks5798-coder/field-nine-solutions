import { NextResponse } from "next/server";
import { z } from "zod";
import { ipFromHeaders, checkLimit, headersFor } from "@/core/rateLimit";
import { slackNotify } from "@/core/integrations/slack";
import { linearCreateIssue } from "@/core/integrations/linear";

export const runtime = "edge";

const ErrorReportSchema = z.object({
  message:   z.string().min(1).max(500),
  stack:     z.string().max(5000).optional(),
  url:       z.string().max(500).optional(),
  component: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  const ip = ipFromHeaders(req.headers);
  const limit = checkLimit(`api:error:${ip}`);
  if (!limit.ok) {
    const res = NextResponse.json({ error: "Too Many Requests" }, { status: 429 });
    Object.entries(headersFor(limit)).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
  const raw = await req.json().catch(() => null);
  const parsed = ErrorReportSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  const { message, stack, url, component } = parsed.data;

  const text =
    `Error: ${message}\n` +
    (url ? `URL: ${url}\n` : "") +
    (component ? `Component: ${component}\n` : "") +
    (stack ? `Stack:\n${stack.slice(0, 2000)}` : "");

  await slackNotify(text);
  const teamId = process.env.LINEAR_TEAM_ID || "";
  if (teamId) {
    await linearCreateIssue({
      teamId,
      title: `Error: ${message.slice(0, 80)}`,
      description: text,
    });
  }
  return NextResponse.json({ ok: true });
}
