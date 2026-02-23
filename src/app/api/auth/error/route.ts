import { NextResponse } from "next/server";

export async function GET() {
  const res = NextResponse.json({ error: "Not found" }, { status: 404 });
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export async function POST() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
