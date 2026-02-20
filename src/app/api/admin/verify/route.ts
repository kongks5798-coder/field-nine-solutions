import { NextResponse } from "next/server";
import { requireAdmin } from "@/core/adminAuth";

export const runtime = "edge";

/** Called by client-side admin layout to verify the httpOnly auth cookie. */
export async function GET(req: Request) {
  const auth = await requireAdmin(req);
  if (!auth.ok) return auth.response;
  return NextResponse.json({ ok: true });
}
