import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const { user, text, timestamp } = await req.json();
  if (!user || !text) {
    return NextResponse.json({ error: 'Missing user or text' }, { status: 400 });
  }
  const logLine = JSON.stringify({ user, text, timestamp: timestamp || new Date().toISOString() }) + '\n';
  const logPath = path.join(process.cwd(), 'logs', 'chat-log.jsonl');
  try {
    await fs.mkdir(path.dirname(logPath), { recursive: true });
    await fs.appendFile(logPath, logLine, 'utf8');
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: 'Log failed', details: e?.toString() }, { status: 500 });
  }
}
