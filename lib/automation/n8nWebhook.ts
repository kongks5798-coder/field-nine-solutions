// n8n Webhook 연동 샘플 함수
// 실제 N8N_WEBHOOK_URL은 .env에 추가 필요

export async function triggerN8nWorkflow(payload: any) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) throw new Error('N8N_WEBHOOK_URL 환경변수가 필요합니다.');
  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('n8n Webhook 호출 실패');
  return res.json();
}
