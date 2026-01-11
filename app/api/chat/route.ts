// app/api/chat/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // 보스의 5090 로컬 서버(Ollama)에 명령 전달
    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      body: JSON.stringify({
        model: 'deepseek-r1:32b', // 5090 최적화 모델
        prompt: `당신은 Field Nine의 CTO 자비스입니다. 보스의 명령에 짧고 명확하게 답하세요: ${message}`,
        stream: false,
      }),
    });

    const data = await response.json();
    return NextResponse.json({ reply: data.response });
  } catch (error) {
    return NextResponse.json({ reply: "보스, 5090 서버 연결을 확인해 주세요. (wsl --shutdown 필요할 수 있음)" }, { status: 500 });
  }
}