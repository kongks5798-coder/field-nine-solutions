import { promises as fs } from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

const FEEDBACK_PATH = path.join(process.cwd(), 'logs', 'user-feedback.jsonl');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { feedback, score, timestamp } = req.body;
    if (!feedback && !score) return res.status(400).json({ error: 'No feedback' });
    const logLine = JSON.stringify({ feedback, score, timestamp: timestamp || new Date().toISOString() }) + '\n';
    await fs.mkdir(path.dirname(FEEDBACK_PATH), { recursive: true });
    await fs.appendFile(FEEDBACK_PATH, logLine, 'utf8');
    return res.status(200).json({ ok: true });
  }
  if (req.method === 'GET') {
    try {
      const data = await fs.readFile(FEEDBACK_PATH, 'utf8');
      const lines = data.trim().split('\n').filter(Boolean);
      const logs = lines.map(line => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean);
      return res.status(200).json({ logs });
    } catch {
      return res.status(200).json({ logs: [] });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
