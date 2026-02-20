import { promises as fs } from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

const FILES = [
  { key: 'chat-log', path: path.join(process.cwd(), 'logs', 'chat-log.jsonl'), label: '대화 로그' },
  { key: 'admin-alert-log', path: path.join(process.cwd(), 'logs', 'admin-alert-log.jsonl'), label: '관리자 알림 로그' },
  { key: 'quality-settings-history', path: path.join(process.cwd(), 'logs', 'quality-settings-history.jsonl'), label: '설정 변경 이력' },
  { key: 'quality-settings', path: path.join(process.cwd(), 'logs', 'quality-settings.json'), label: '설정값' },
];

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { file } = req.query;
  const meta = FILES.find(f => f.key === file);
  if (!meta) return res.status(404).json({ error: 'File not found' });
  try {
    const data = await fs.readFile(meta.path);
    res.setHeader('Content-Disposition', `attachment; filename=${meta.key}.${meta.path.endsWith('.jsonl') ? 'jsonl' : 'json'}`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.status(200).send(data);
  } catch {
    res.status(404).json({ error: 'File not found' });
  }
}
