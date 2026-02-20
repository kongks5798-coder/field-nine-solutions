import { promises as fs } from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

const SETTINGS_PATH = path.join(process.cwd(), 'logs', 'quality-settings.json');
const HISTORY_PATH = path.join(process.cwd(), 'logs', 'quality-settings-history.jsonl');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    // 변경 이력 기록
    const { prev, next, user, timestamp } = req.body;
    if (!prev || !next) return res.status(400).json({ error: 'Missing prev/next' });
    const logLine = JSON.stringify({ prev, next, user: user || 'admin', timestamp: timestamp || new Date().toISOString() }) + '\n';
    await fs.mkdir(path.dirname(HISTORY_PATH), { recursive: true });
    await fs.appendFile(HISTORY_PATH, logLine, 'utf8');
    return res.status(200).json({ ok: true });
  }
  if (req.method === 'GET') {
    try {
      const data = await fs.readFile(HISTORY_PATH, 'utf8');
      const lines = data.trim().split('\n').filter(Boolean);
      const logs = lines.map(line => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean);
      return res.status(200).json({ logs });
    } catch {
      return res.status(200).json({ logs: [] });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
