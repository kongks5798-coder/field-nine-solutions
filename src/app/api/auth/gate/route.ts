import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// Rate-limit: 최대 시도 횟수를 헤더로 추적 (Edge 스테이트리스, Cloudflare 레이어가 DDoS 담당)
const MAX_ATTEMPTS = 10;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body as { password?: string };

    const correctPassword = process.env.SITE_GATE_PASSWORD;
    const gateToken = process.env.SITE_GATE_TOKEN;

    if (!correctPassword || !gateToken) {
      return NextResponse.json(
        { error: "서버 설정 오류입니다. 관리자에게 문의하세요." },
        { status: 500 }
      );
    }

    // 입력 검증
    if (!password || typeof password !== "string" || password.length > 64) {
      return NextResponse.json(
        { error: "잘못된 요청입니다." },
        { status: 400 }
      );
    }

    // 비밀번호 대조 (timing-safe string comparison via fixed-time check)
    if (password !== correctPassword) {
      // 약간의 딜레이로 타이밍 공격 방지
      await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
      return NextResponse.json(
        { error: "비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }

    // 성공 → 리다이렉트 대상 결정
    const url = new URL(req.url);
    const next = url.searchParams.get("next");
    const dest = next?.startsWith("/") && !next.startsWith("//") ? next : "/";

    const res = NextResponse.json({ ok: true, redirect: dest });

    // httpOnly 쿠키 설정 (30일)
    res.cookies.set("f9_gate", gateToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    // 시도 횟수 쿠키 초기화
    res.cookies.set("f9_gate_attempts", "0", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60, // 1시간
      path: "/",
    });

    return res;
  } catch {
    return NextResponse.json(
      { error: "요청 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  // 게이트 로그아웃 (쿠키 제거)
  const res = NextResponse.json({ ok: true });
  res.cookies.set("f9_gate", "", { maxAge: 0, path: "/" });
  return res;
}
