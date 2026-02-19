// 운영/보안 모니터링 자동화 함수
// 에러, 이상, 보안 이벤트 감지 및 알림
import { notifySlack } from './notify';

export async function reportError(error: Error | string, context?: string) {
  const msg = `[에러 감지]${context ? ` [${context}]` : ''} ${typeof error === 'string' ? error : error.message}`;
  try {
    await notifySlack(msg);
  } catch (e) { /* 알림 실패는 무시 */ }
}

export async function reportSecurityEvent(event: string, detail?: string) {
  const msg = `[보안 이벤트] ${event}${detail ? `: ${detail}` : ''}`;
  try {
    await notifySlack(msg);
  } catch (e) { /* 알림 실패는 무시 */ }
}
