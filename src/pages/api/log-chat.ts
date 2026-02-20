import { NextApiRequest, NextApiResponse } from 'next';
import { promises as fs } from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { user, text, timestamp } = req.body;
  if (!user || !text) {
    return res.status(400).json({ error: 'Missing user or text' });
  }
  const logLine = JSON.stringify({ user, text, timestamp: timestamp || new Date().toISOString() }) + '\n';
  const logPath = path.join(process.cwd(), 'logs', 'chat-log.jsonl');
  try {
    await fs.mkdir(path.dirname(logPath), { recursive: true });
    await fs.appendFile(logPath, logLine, 'utf8');
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Log failed', details: e?.toString() });
  }
}
