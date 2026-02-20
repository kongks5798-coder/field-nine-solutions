import { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || '';
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465', 10);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { subject, text } = req.body;
  if (!ADMIN_EMAIL || !SMTP_USER || !SMTP_PASS) {
    return res.status(500).json({ error: 'SMTP config missing' });
  }
  try {
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: true,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transporter.sendMail({
      from: SMTP_USER,
      to: ADMIN_EMAIL,
      subject: subject || 'AI 품질 자동 알림',
      text: text || '',
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Email send failed', details: e?.toString() });
  }
}
