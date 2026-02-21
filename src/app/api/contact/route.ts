import { NextRequest, NextResponse } from 'next/server';
import { sendContactEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, email, company, message, type } = body as {
      name?: string; email?: string; company?: string;
      message?: string; type?: string;
    };

    if (!name || !email) {
      return NextResponse.json({ error: '이름과 이메일은 필수입니다.' }, { status: 400 });
    }

    // 이메일 전송 시도 (RESEND_API_KEY 없으면 건너뜀)
    if (process.env.RESEND_API_KEY) {
      await sendContactEmail({ name, email, company, message, type }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
