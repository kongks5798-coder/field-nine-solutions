import { promises as fs } from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

const SETTINGS_PATH = path.join(process.cwd(), 'logs', 'quality-settings.json');
const DEFAULTS = { notifyThreshold: 50, alertInterval: 10 };

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const data = await fs.readFile(SETTINGS_PATH, 'utf8');
      return res.status(200).json(JSON.parse(data));
    } catch {
      return res.status(200).json(DEFAULTS);
    }
  }
  if (req.method === 'POST') {
    const { notifyThreshold, alertInterval } = req.body;
    const settings = {
      notifyThreshold: typeof notifyThreshold === 'number' ? notifyThreshold : DEFAULTS.notifyThreshold,
      alertInterval: typeof alertInterval === 'number' ? alertInterval : DEFAULTS.alertInterval,
    };
    await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
    await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings), 'utf8');
    return res.status(200).json({ ok: true });
  }
  return res.status(405).json({ error: 'Method not allowed' });
}
