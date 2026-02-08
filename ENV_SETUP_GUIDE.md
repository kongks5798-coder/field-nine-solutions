# 🔧 환경 변수 설정 가이드

## 문제 해결

브라우저에서 "Missing required environment variables" 에러가 발생하는 경우, `.env.local` 파일을 생성해야 합니다.

---

## 📝 설정 방법

### 1. `.env.local` 파일 생성

프로젝트 루트 디렉토리에 `.env.local` 파일을 생성하세요.

```bash
# Windows PowerShell
New-Item -Path .env.local -ItemType File

# 또는 직접 파일 생성
```

### 2. Supabase 키 가져오기

1. [Supabase 대시보드](https://app.supabase.com)에 로그인
2. 프로젝트 선택
3. **Settings** > **API** 메뉴로 이동
4. 다음 정보를 복사:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. `.env.local` 파일에 값 입력

`.env.local` 파일을 열고 다음 형식으로 입력:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**예시**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NTIzNDU2NywiZXhwIjoxOTYwODEwNTY3fQ.example
```

### 4. 개발 서버 재시작

`.env.local` 파일을 생성/수정한 후에는 **반드시 개발 서버를 재시작**해야 합니다.

```bash
# 서버 중지 (Ctrl+C)
# 그 다음 재시작
npm run dev
```

---

## ✅ 확인 방법

서버를 재시작한 후 브라우저를 새로고침하면 에러가 사라집니다.

---

## 🚨 중요 사항

1. **`.env.local` 파일은 절대 Git에 커밋하지 마세요**
   - `.gitignore`에 이미 포함되어 있습니다
   - 이 파일에는 민감한 정보가 포함됩니다

2. **환경 변수 이름 확인**
   - `NEXT_PUBLIC_` 접두사가 있어야 클라이언트에서 사용 가능합니다
   - 대소문자를 정확히 입력하세요

3. **개발 모드에서는 환경 변수가 없어도 경고만 표시됩니다**
   - 실제 기능을 사용하려면 반드시 환경 변수를 설정해야 합니다
   - 프로덕션 배포 전에는 반드시 환경 변수를 설정하세요

---

## 📋 템플릿 파일

`.env.local.example` 파일을 참고하여 `.env.local` 파일을 생성할 수 있습니다.

```bash
# .env.local.example을 복사하여 .env.local 생성
Copy-Item .env.local.example .env.local
```

그 다음 `.env.local` 파일을 열어 실제 Supabase 키를 입력하세요.

---

## 🔍 문제 해결

### 에러가 계속 발생하는 경우:

1. **파일 이름 확인**: `.env.local` (앞에 점이 있어야 함)
2. **파일 위치 확인**: 프로젝트 루트 디렉토리에 있어야 함
3. **서버 재시작**: 환경 변수 변경 후 반드시 서버 재시작
4. **값 확인**: Supabase 대시보드에서 키를 다시 복사하여 붙여넣기

### 여전히 문제가 있는 경우:

개발 모드에서는 환경 변수가 없어도 경고만 표시되고 더미 값으로 계속 진행됩니다.
실제 인증 기능을 사용하려면 반드시 `.env.local` 파일을 설정해야 합니다.
