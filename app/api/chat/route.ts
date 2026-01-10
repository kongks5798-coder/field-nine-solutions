// Field Nine AI API Bridge v1.0
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    // 보스의 5090 서버 안에서 돌아가는 Ollama(DeepSeek)에게 질문을 보냅니다.
    const response = await fetch('http://host.docker.internal:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-r1:32b', // 5090 VRAM 최적화 모델 [cite: 2025-12-28]
        prompt: `당신은 Field Nine의 수석 전략 AI입니다. 보스의 비즈니스를 위해 간결하고 품격 있게 답하세요: ${prompt}`,
        stream: false,
      }),
    });

    const data = await response.json();
    return NextResponse.json({ result: data.response });
  } catch (error) {
    return NextResponse.json({ result: "보스, AI 엔진 연결을 확인해주세요." }, { status: 500 });
  }
}