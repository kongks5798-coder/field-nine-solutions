// AI 품질 평가 함수: 프롬프트, 응답, 기대값을 받아 품질 점수와 피드백 반환
export async function evaluateAIResponseQuality({ prompt, response, expected }: { prompt: string, response: string, expected?: string }) {
  // 간단한 품질 평가 로직(실제 서비스에서는 더 복잡한 평가/로그/튜닝 가능)
  let score = 0;
  let feedback = '';
  if (!response) {
    score = 0;
    feedback = '응답이 없습니다.';
  } else if (expected && response.trim() === expected.trim()) {
    score = 100;
    feedback = '정확한 답변입니다!';
  } else if (expected && response.includes(expected)) {
    score = 80;
    feedback = '부분적으로 일치합니다.';
  } else if (response.length > 10) {
    score = 60;
    feedback = '응답이 있으나 기대와 다릅니다.';
  } else {
    score = 20;
    feedback = '응답 품질이 낮습니다.';
  }
  return { prompt, response, expected, score, feedback, timestamp: new Date().toISOString() };
}
