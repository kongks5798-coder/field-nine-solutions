/**
 * OpenAI API 연동 테스트
 */
import OpenAI from 'openai';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .env.local 로드
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

async function main() {
  console.log('\n========================================');
  console.log('  OpenAI API 연동 테스트');
  console.log('  Field Nine - JARVIS');
  console.log('========================================\n');

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.log('❌ OPENAI_API_KEY가 설정되지 않았습니다.');
    return;
  }

  console.log('🔑 API Key:', apiKey.substring(0, 20) + '...');

  const openai = new OpenAI({ apiKey });

  console.log('\n🤖 GPT-4에게 테스트 메시지 전송 중...\n');

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are JARVIS, an AI assistant for Field Nine. Respond briefly in Korean.'
        },
        {
          role: 'user',
          content: '안녕, 자비스! 연결 테스트야. 짧게 대답해줘.'
        }
      ],
      max_tokens: 100
    });

    const reply = response.choices[0]?.message?.content;

    console.log('✅ 응답 성공!\n');
    console.log('🤖 JARVIS:', reply);
    console.log('\n========================================');
    console.log('  🎉 OpenAI API 연동 완료!');
    console.log('========================================\n');

  } catch (error: any) {
    console.log('❌ 오류 발생:', error.message);
  }
}

main();
