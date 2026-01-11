import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Demo Request API
 * 실제 데모 신청 폼 제출 처리
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, company } = body;

    // Validation
    if (!name || !email) {
      return NextResponse.json(
        { 
          success: false, 
          error: '이름과 이메일은 필수입니다.',
          errorEn: 'Name and email are required.'
        },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { 
          success: false, 
          error: '유효한 이메일 주소를 입력해주세요.',
          errorEn: 'Please enter a valid email address.'
        },
        { status: 400 }
      );
    }

    // Simulate API call (실제로는 데이터베이스에 저장하거나 이메일 서비스로 전송)
    // 여기서는 로그만 남기고 성공 응답
    console.log('[Demo Request]', {
      name,
      email,
      company: company || 'N/A',
      timestamp: new Date().toISOString(),
    });

    // 실제 환경에서는 여기에 다음을 추가:
    // 1. 데이터베이스 저장 (Supabase/Prisma)
    // 2. 이메일 알림 (SendGrid/Resend)
    // 3. CRM 연동 (HubSpot/Salesforce)

    return NextResponse.json(
      {
        success: true,
        message: '데모 신청이 완료되었습니다. 곧 연락드리겠습니다.',
        messageEn: 'Demo request submitted successfully. We will contact you soon.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Demo Request API] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        errorEn: 'Server error occurred. Please try again later.'
      },
      { status: 500 }
    );
  }
}
