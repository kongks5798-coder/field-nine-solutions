import { NextApiRequest, NextApiResponse } from 'next';
import { evaluateAIResponseQuality } from '../../lib/ai/quality-eval';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { prompt, response, expected } = req.body;
  if (!prompt || !response) {
    return res.status(400).json({ error: 'Missing prompt or response' });
  }
  try {
    const result = await evaluateAIResponseQuality({ prompt, response, expected });
    res.status(200).json(result);
  } catch (e) {
    res.status(500).json({ error: 'Evaluation failed', details: e?.toString() });
  }
}
