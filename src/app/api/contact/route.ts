import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sendContactEmail } from '@/lib/email';
import { log } from '@/lib/logger';

const ContactSchema = z.object({
  name:    z.string().min(1, '이름을 입력하세요').max(100),
  email:   z.string().email('올바른 이메일 주소를 입력하세요').max(200),
  company: z.string().max(200).optional(),
  message: z.string().max(5000).optional(),
  type:    z.string().max(50).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const parsed = ContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: '입력값이 올바르지 않습니다.' }, { status: 400 });
    }
    const { name, email, company, message, type } = parsed.data;

    // 이메일 전송 시도 (RESEND_API_KEY 없으면 건너뜀)
    if (process.env.RESEND_API_KEY) {
      await sendContactEmail({ name, email, company, message, type }).catch((err: unknown) => {
        log.error('[Contact] 이메일 전송 실패', { error: err instanceof Error ? err.message : String(err) });
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
