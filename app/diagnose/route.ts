import { createClient } from '@/src/utils/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // 1. Supabase & Gemini 준비
    const supabase = await createClient();
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    // 2. 진단 안 된 요청 가져오기
    const { data: requests, error } = await supabase
      .from('requests')
      .select('*')
      .is('diagnosis', null)
      .limit(1); // 한 번에 하나씩 처리

    if (error) throw error;
    if (!requests || requests.length === 0) {
      return NextResponse.json({ message: '대기 중인 요청이 없습니다.' });
    }

    const target = requests[0];
    const prompt = `
      당신은 비즈니스 컨설턴트 Jarvis입니다.
      고민: "${target.symptom}"
      3줄 이내로 명확한 해결책을 제시해주세요.
    `;

    // 3. AI에게 물어보기
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const diagnosisText = response.text();

    // 4. 결과 저장하기
    await supabase
      .from('requests')
      .update({ diagnosis: diagnosisText })
      .eq('id', target.id);

    return NextResponse.json({ 
      success: true, 
      message: '진단 완료!', 
      diagnosis: diagnosisText 
    });

  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}