import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const FEEDBACK_PATH = path.join(process.cwd(), 'logs', 'user-feedback.jsonl');

export async function POST(req: NextRequest) {
  const { feedback, score, timestamp } = await req.json();
  if (!feedback && !score) {
    return NextResponse.json({ error: 'No feedback' }, { status: 400 });
  }
  const logLine = JSON.stringify({ feedback, score, timestamp: timestamp || new Date().toISOString() }) + '\n';
  await fs.mkdir(path.dirname(FEEDBACK_PATH), { recursive: true });
  await fs.appendFile(FEEDBACK_PATH, logLine, 'utf8');
  return NextResponse.json({ ok: true });
}

export async function GET() {
  try {
    const data = await fs.readFile(FEEDBACK_PATH, 'utf8');
    const lines = data.trim().split('\n').filter(Boolean);
    const logs = lines.map(line => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean);
    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ logs: [] });
  }
}
