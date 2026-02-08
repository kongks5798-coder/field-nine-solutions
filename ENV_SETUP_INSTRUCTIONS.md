# 🔐 환경 변수 설정 가이드

**중요:** 실제 Supabase 데이터베이스를 사용하려면 환경 변수를 설정해야 합니다!

---

## 📋 1단계: .env.local 파일 생성

### Windows PowerShell:
```powershell
Copy-Item .env.local.example .env.local
```

### Mac/Linux:
```bash
cp .env.local.example .env.local
```

---

## 📋 2단계: Supabase 키 가져오기

### 2-1. Supabase 대시보드 접속

1. 브라우저에서 접속:
   ```
   https://supabase.com/dashboard
   ```

2. 프로젝트 선택 (또는 새 프로젝트 생성)

### 2-2. API 키 확인

1. 왼쪽 메뉴에서 **"Settings"** 클릭
2. **"API"** 클릭
3. 다음 정보를 복사:
   - **Project URL** (예: `https://xxxxx.supabase.co`)
   - **anon public** key (긴 문자열)

---

## 📋 3단계: .env.local 파일 수정

`.env.local` 파일을 열고 다음 값들을 실제 값으로 변경:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://ivazoqddehjbfhmfdmck.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2YXpvcWRkZWhqYmZobWZkbWNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc3MDYyODYsImV4cCI6MjA4MzI4MjI4Nn0.Sb-lQPN5apyh3Y9KU-wjvsWJzIG8UOM-WH5T1dF1Qq4

# Service Role Key (서버 사이드 전용)
# Settings > API > service_role key에서 복사
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Encryption Key (64자리 hex 문자열)
# Python으로 생성: python -c "import secrets; print(secrets.token_hex(32))"
ENCRYPTION_KEY=your-64-character-hex-key-here
```

**⚠️ 주의:** 
- `anon public` 키 앞에 "anon pubic"이 아니라 실제 키 값만 입력하세요.
- 제공된 키에 "anon pubic"이라는 텍스트가 포함되어 있다면 제거하세요.

---

## 📋 4단계: 앱 재시작

환경 변수를 변경한 후에는 반드시 앱을 재시작해야 합니다:

```powershell
# 터미널에서 Ctrl+C로 중지 후
npm run dev
```

---

## ✅ 확인 방법

1. 브라우저 콘솔 열기 (F12)
2. `/dashboard/inventory` 페이지 접속
3. 콘솔에 에러가 없으면 성공!

---

## 🚨 문제 해결

### "환경 변수가 설정되지 않았습니다" 경고

- `.env.local` 파일이 프로젝트 루트에 있는지 확인
- 파일 이름이 정확히 `.env.local`인지 확인 (`.env.local.txt` 아님)
- 앱을 재시작했는지 확인

### "Unauthorized" 에러

- Supabase 키가 올바른지 확인
- 로그인이 되어 있는지 확인

---

**완료되면 다음 단계로 진행하세요: 데이터베이스 스키마 생성!**
