
import { promises as fs } from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

const LOG_PATH = path.join(process.cwd(), 'logs', 'chat-log.jsonl');
const SETTINGS_PATH = path.join(process.cwd(), 'logs', 'quality-settings.json');
let lastNotified = 0;

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
    // 최근 100건만 검사
    const recent = logs.slice(-100);
    // 설정값 불러오기
    let notifyThreshold = 50, alertInterval = 10;
    try {
      const settings = JSON.parse(await fs.readFile(SETTINGS_PATH, 'utf8'));
      if (typeof settings.notifyThreshold === 'number') notifyThreshold = settings.notifyThreshold;
      if (typeof settings.alertInterval === 'number') alertInterval = settings.alertInterval;
    } catch {}

    // 저품질 메시지만 추출
    const lowQuality: Record<string, unknown>[] = [];
    for (const log of recent) {
      const res = await fetch('http://localhost:3000/api/ai-quality-eval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: '', response: log.text })
      });
      const data = await res.json();
      if (data.score < notifyThreshold) {
        lowQuality.push({ ...log, ...data });
      }
    }
    // 개선 추천 메시지 생성
    let suggestion = '';
    if (lowQuality.length > 0) {
      suggestion = `최근 ${lowQuality.length}건의 저품질(${notifyThreshold}점 미만) 응답이 감지되었습니다.\n` +
        '주요 피드백:\n' +
        lowQuality.slice(0, 3).map(l => `- [${l.user}] ${l.text} → ${l.feedback}`).join('\n') +
        '\nAI 프롬프트/엔진/데이터 튜닝을 권장합니다.';
      // 중복 알림 방지(설정값 반영)
      if (Date.now() - lastNotified > alertInterval * 60 * 1000) {
        lastNotified = Date.now();
        // 이메일 자동 발송
        fetch('http://localhost:3000/api/send-admin-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: '[AI 품질 자동 알림] 저품질 응답 감지',
            text: suggestion
          })
        });
        // 관리자 알림 이력 로그 기록
        fetch('http://localhost:3000/api/admin-alert-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'quality-alert',
            message: suggestion,
            timestamp: new Date().toISOString()
          })
        });
      }
    }
    res.status(200).json({ lowQuality, suggestion });
  } catch (e) {
    res.status(200).json({ lowQuality: [], suggestion: '' });
  }
}
