import { promises as fs } from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

const LOG_PATH = path.join(process.cwd(), 'logs', 'chat-log.jsonl');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const data = await fs.readFile(LOG_PATH, 'utf8');
    const lines = data.trim().split('\n').filter(Boolean);
    const logs = lines.map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);
    res.status(200).json({ logs });
  } catch (e) {
    res.status(200).json({ logs: [] });
  }
}
