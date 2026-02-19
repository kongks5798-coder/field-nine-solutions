// Dummy quality-eval for build
export async function evaluateAIResponseQuality({ prompt, response, expected }: { prompt: string; response: string; expected?: string }) {
  return { prompt, response, expected, score: 100, feedback: 'OK', timestamp: new Date().toISOString() };
}