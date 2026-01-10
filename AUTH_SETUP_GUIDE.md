# 🔐 Field Nine - 인증 시스템 설정 가이드

**NextAuth.js v5 기반 카카오톡/구글 로그인**

---

## 🚀 빠른 시작 (5분)

### Step 1: 환경 변수 설정

`.env.local` 파일에 다음 추가:

```env
# NextAuth.js
NEXTAUTH_SECRET=your_random_32_char_secret_key_here
NEXTAUTH_URL=http://localhost:3000

# Kakao OAuth
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Step 2: NEXTAUTH_SECRET 생성

```powershell
# PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# 또는 온라인 생성기 사용
# https://generate-secret.vercel.app/32
```

### Step 3: 카카오톡 개발자 설정

1. **카카오 개발자 콘솔 접속**
   - https://developers.kakao.com/

2. **애플리케이션 생성**
   - 내 애플리케이션 > 애플리케이션 추가하기

3. **플랫폼 설정**
   - 플랫폼 > Web 플랫폼 등록
   - 사이트 도메인: `http://localhost:3000` (개발)
   - 사이트 도메인: `https://fieldnine.io` (프로덕션)

4. **카카오 로그인 활성화**
   - 제품 설정 > 카카오 로그인 > 활성화 설정: ON

5. **Redirect URI 설정**
   - Redirect URI: `http://localhost:3000/api/auth/callback/kakao` (개발)
   - Redirect URI: `https://fieldnine.io/api/auth/callback/kakao` (프로덕션)

6. **REST API 키 복사**
   - 앱 키 > REST API 키 → `KAKAO_CLIENT_ID`
   - 카카오 로그인 > 보안 > Client Secret → `KAKAO_CLIENT_SECRET`

### Step 4: 구글 OAuth 설정

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com/

2. **프로젝트 생성**
   - 새 프로젝트 생성

3. **OAuth 동의 화면 설정**
   - APIs & Services > OAuth consent screen
   - User Type: External 선택
   - 앱 정보 입력

4. **OAuth 클라이언트 ID 생성**
   - APIs & Services > Credentials > Create Credentials > OAuth client ID
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (개발)
     - `https://fieldnine.io/api/auth/callback/google` (프로덕션)

5. **클라이언트 ID/Secret 복사**
   - Client ID → `GOOGLE_CLIENT_ID`
   - Client secret → `GOOGLE_CLIENT_SECRET`

### Step 5: 데이터베이스 마이그레이션

```powershell
# Prisma 마이그레이션
npm run prisma:push

# 또는 Supabase SQL Editor에서
# supabase/migrations/014_add_nextauth_tables.sql 실행
```

### Step 6: 테스트

```powershell
# 개발 서버 실행
npm run dev

# 브라우저에서 접속
# http://localhost:3000/login
```

---

## ✅ 확인 체크리스트

- [ ] `.env.local`에 모든 환경 변수 설정
- [ ] `NEXTAUTH_SECRET` 생성 (32자 이상)
- [ ] 카카오 개발자 콘솔 설정 완료
- [ ] 구글 OAuth 설정 완료
- [ ] 데이터베이스 마이그레이션 완료
- [ ] 로그인 페이지 접속 확인
- [ ] 카카오톡 로그인 테스트
- [ ] 구글 로그인 테스트

---

## 🔒 보안 체크리스트

- [ ] `NEXTAUTH_SECRET`는 강력한 랜덤 문자열 (32자 이상)
- [ ] 환경 변수는 `.env.local`에만 저장 (Git에 커밋 금지)
- [ ] Vercel 배포 시 환경 변수 설정 확인
- [ ] HTTPS 사용 (프로덕션)

---

## 🚀 Vercel 배포 시

**Vercel Dashboard** > 프로젝트 > Settings > Environment Variables:

다음 변수 추가:
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (https://fieldnine.io)
- `KAKAO_CLIENT_ID`
- `KAKAO_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

---

## 🎯 완료!

**인증 시스템이 준비되었습니다!**

**접속 URL:**
- 로컬: `http://localhost:3000/login`
- 프로덕션: `https://fieldnine.io/login`

---

**Field Nine - Tesla of ERPs** 🚀
