import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const PANOPTICON_PASSWORD = process.env.PANOPTICON_PASSWORD || 'fieldnine2025!';
const COOKIE_NAME = 'panopticon_auth';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get(COOKIE_NAME);

    return NextResponse.json({
      authenticated: authCookie?.value === 'authenticated'
    });
  } catch (error) {
    return NextResponse.json({
      authenticated: false
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    if (password === PANOPTICON_PASSWORD) {
      const response = NextResponse.json({
        success: true,
        message: '로그인 성공'
      });

      response.cookies.set(COOKIE_NAME, 'authenticated', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours
        path: '/'
      });

      return response;
    }

    return NextResponse.json({
      success: false,
      error: '비밀번호가 올바르지 않습니다'
    }, { status: 401 });

  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json({
      success: false,
      error: '로그인 처리 중 오류가 발생했습니다'
    }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json({
      success: true,
      message: '로그아웃 성공'
    });

    response.cookies.delete(COOKIE_NAME);

    return response;
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '로그아웃 처리 중 오류가 발생했습니다'
    }, { status: 500 });
  }
}
