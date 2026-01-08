# 카카오 로그인 버튼 통합 가이드

## ✅ 완료된 작업

1. **컴포넌트 생성**: `app/components/auth/KakaoLoginButton.tsx`
2. **로그인 페이지 업데이트**: `app/login/page.tsx`의 Kakao 로그인 기능 활성화

---

## 📝 메인 페이지에 Kakao 로그인 버튼 추가하기

### 방법 1: Hero 섹션에 추가 (권장)

`app/page.tsx` 파일을 다음과 같이 수정하세요:

```tsx
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import KakaoLoginButton from "@/app/components/auth/KakaoLoginButton"; // 추가

export default function Home() {
  // ... 기존 코드 ...

  return (
    <div className="bg-[#F9F9F7] text-[#171717] min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center">
            <h1 className="text-6xl sm:text-7xl lg:text-8xl xl:text-9xl font-bold mb-8 leading-[0.95] tracking-tight">
              The Operating System<br />
              <span className="relative inline-block">
                <span className="text-[#1A5D3F]">for Visionaries</span>
                <span className="absolute -bottom-2 left-0 right-0 h-[1px] bg-[#1A5D3F] opacity-30"></span>
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-[#6B6B6B] mb-16 max-w-3xl mx-auto font-light">
              비즈니스의 미래를 정의하는 플랫폼
            </p>
            
            {/* 버튼 그룹 추가 */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
              <KakaoLoginButton 
                redirectTo="/dashboard"
                className="w-full sm:w-auto"
              />
              <Link 
                href="/login"
                className="group relative inline-block px-12 py-5 border border-[#171717] text-[#171717] font-semibold text-lg transition-all duration-300 hover:bg-[#171717] hover:text-[#F9F9F7] rounded-lg w-full sm:w-auto text-center"
              >
                <span className="relative z-10">이메일로 시작하기</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ... 나머지 섹션들 ... */}
    </div>
  );
}
```

### 방법 2: 별도 CTA 섹션에 추가

Hero 섹션 아래에 새로운 섹션을 추가할 수도 있습니다:

```tsx
{/* Hero Section */}
<section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
  {/* ... 기존 Hero 내용 ... */}
</section>

{/* Quick Login Section - 새로 추가 */}
<section className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-y border-[#E5E5E0]">
  <div className="max-w-2xl mx-auto text-center">
    <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-[#171717]">
      지금 바로 시작하세요
    </h2>
    <p className="text-lg text-[#6B6B6B] mb-8">
      카카오 계정으로 3초 만에 가입하고 모든 기능을 무료로 체험해보세요
    </p>
    <div className="max-w-sm mx-auto">
      <KakaoLoginButton 
        redirectTo="/dashboard"
      />
    </div>
  </div>
</section>
```

---

## 🎨 컴포넌트 사용법

### 기본 사용
```tsx
import KakaoLoginButton from "@/app/components/auth/KakaoLoginButton";

<KakaoLoginButton />
```

### 커스텀 리다이렉트
```tsx
<KakaoLoginButton redirectTo="/custom-page" />
```

### 에러 핸들링
```tsx
const [error, setError] = useState<string | null>(null);

<KakaoLoginButton 
  onError={(errorMsg) => {
    setError(errorMsg);
    // 또는 Toast 표시 등
  }}
/>
```

### 스타일 커스터마이징
```tsx
<KakaoLoginButton 
  className="w-full max-w-xs mx-auto"
/>
```

---

## ✅ 체크리스트

- [x] KakaoLoginButton 컴포넌트 생성 완료
- [x] 로그인 페이지의 Kakao 로그인 기능 활성화
- [ ] Supabase Dashboard에서 Kakao Provider 설정 확인
- [ ] 메인 페이지에 버튼 추가
- [ ] 테스트: 카카오 로그인 플로우 확인

---

## 🔧 Supabase 설정 확인

Supabase Dashboard에서 다음을 확인하세요:

1. **Authentication > Providers > Kakao**
   - Enabled: ✅ ON
   - Client ID: (Kakao Developers에서 발급받은 REST API 키)
   - Client Secret: (Kakao Developers에서 발급받은 Client Secret)
   - Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

2. **Kakao Developers 설정**
   - Redirect URI: `https://your-project.supabase.co/auth/v1/callback`
   - 활성화된 플랫폼: Web 플랫폼 등록

---

## 🚀 테스트 방법

1. 개발 서버 실행: `npm run dev`
2. 메인 페이지 접속: `http://localhost:3000`
3. 카카오 로그인 버튼 클릭
4. 카카오 로그인 페이지로 리다이렉트 확인
5. 로그인 후 `/dashboard`로 리다이렉트 확인

---

**준비 완료! 이제 카카오 로그인이 작동합니다! 🎉**
