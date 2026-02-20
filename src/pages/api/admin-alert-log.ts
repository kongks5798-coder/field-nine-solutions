import { promises as fs } from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

const LOG_PATH = path.join(process.cwd(), 'logs', 'admin-alert-log.jsonl');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // 알림 기록 저장
    const { type, message, timestamp } = req.body;
    if (!type || !message) return res.status(400).json({ error: 'Missing type or message' });
    const logLine = JSON.stringify({ type, message, timestamp: timestamp || new Date().toISOString() }) + '\n';
    await fs.mkdir(path.dirname(LOG_PATH), { recursive: true });
    await fs.appendFile(LOG_PATH, logLine, 'utf8');
    return res.status(200).json({ ok: true });
  }
  if (req.method === 'GET') {
    // 알림 기록 조회
    try {
      const data = await fs.readFile(LOG_PATH, 'utf8');
      const lines = data.trim().split('\n').filter(Boolean);
      const logs = lines.map(line => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean);
      return res.status(200).json({ logs });
    } catch {
      return res.status(200).json({ logs: [] });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
