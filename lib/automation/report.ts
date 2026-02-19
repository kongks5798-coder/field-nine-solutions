import { generatePDFReport } from './pdf';
// 월간 리포트 생성 및 PDF 변환/Slack 발송 샘플
export async function generateAndSendMonthlyReport({
  stats,
  aiMode = 'openai',
}: {
  stats: { users: number; errors: number; automations: number; successRate: number };
  aiMode?: AIMode;
}) {
  const prompt = `지난달 운영 현황:\n- 총 사용자: ${stats.users}명\n- 에러 발생: ${stats.errors}건\n- 자동화 실행: ${stats.automations}회\n- 자동화 성공률: ${stats.successRate}%\n이 데이터를 바탕으로 관리자에게 보낼 월간 운영 요약 리포트를 5줄 이내로 작성해줘.`;
  const res = await askMultiAI({ prompt, mode: aiMode });
  let summary = '';
  if (aiMode === 'openai') summary = res.choices?.[0]?.message?.content || '';
  else if (aiMode === 'gemini') summary = res.candidates?.[0]?.content?.parts?.[0]?.text || '';
  else if (aiMode === 'anthropic') summary = res.content?.[0]?.text || '';
  // PDF 변환
  const pdf = generatePDFReport('월간 운영 리포트', summary);
  // (실제 배포 시 PDF 저장/첨부 등 구현 필요)
  await notifySlack(`[월간 운영 리포트]\n${summary}`);
  return { summary, pdf };
}

// 관리자별 맞춤 리포트 샘플
export async function generateAndSendCustomReport({
  stats,
  admin,
  aiMode = 'openai',
}: {
  stats: { users: number; errors: number; automations: number; successRate: number };
  admin: { name: string; email: string; role: string };
  aiMode?: AIMode;
}) {
  const prompt = `운영 현황:\n- 총 사용자: ${stats.users}명\n- 에러 발생: ${stats.errors}건\n- 자동화 실행: ${stats.automations}회\n- 자동화 성공률: ${stats.successRate}%\n이 데이터를 바탕으로 ${admin.name}(${admin.role}) 관리자에게 맞춤형 운영 요약 리포트를 3줄로 작성해줘.`;
  const res = await askMultiAI({ prompt, mode: aiMode });
  let summary = '';
  if (aiMode === 'openai') summary = res.choices?.[0]?.message?.content || '';
  else if (aiMode === 'gemini') summary = res.candidates?.[0]?.content?.parts?.[0]?.text || '';
  else if (aiMode === 'anthropic') summary = res.content?.[0]?.text || '';
  // PDF 변환
  const pdf = generatePDFReport(`${admin.name} 관리자 맞춤 리포트`, summary);
  // (실제 배포 시 PDF 저장/첨부, 이메일 발송 등 구현 필요)
  await notifySlack(`[맞춤 리포트] ${admin.name}\n${summary}`);
  return { summary, pdf };
}
// AI 기반 운영 리포트 자동 생성 함수
import { askMultiAI, AIMode } from '../ai/multiAI';
import { notifySlack } from './notify';

// 샘플: 운영 데이터 요약/AI 리포트 생성 및 Slack 발송
export async function generateAndSendWeeklyReport({
  stats,
  aiMode = 'openai',
}: {
  stats: { users: number; errors: number; automations: number; successRate: number };
  aiMode?: AIMode;
}) {
  // 운영 데이터 요약 프롬프트 생성
  const prompt = `지난주 운영 현황:
- 총 사용자: ${stats.users}명
- 에러 발생: ${stats.errors}건
- 자동화 실행: ${stats.automations}회
- 자동화 성공률: ${stats.successRate}%
이 데이터를 바탕으로 관리자에게 보낼 주간 운영 요약 리포트를 5줄 이내로 작성해줘.`;
  // AI 요약 생성
  const res = await askMultiAI({ prompt, mode: aiMode });
  let summary = '';
  if (aiMode === 'openai') summary = res.choices?.[0]?.message?.content || '';
  else if (aiMode === 'gemini') summary = res.candidates?.[0]?.content?.parts?.[0]?.text || '';
  else if (aiMode === 'anthropic') summary = res.content?.[0]?.text || '';
  // Slack 알림 발송
  await notifySlack(`[주간 운영 리포트]\n${summary}`);
  return summary;
}
