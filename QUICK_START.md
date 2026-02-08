# 🚀 Field Nine Production Quick Start

## 즉시 실행 순서

### 1️⃣ 패키지 설치 (터미널)

```bash
npm install @supabase/ssr
npm install --save-dev supabase
```

### 2️⃣ Supabase SQL 실행

1. https://app.supabase.com 접속
2. 프로젝트 선택 > **SQL Editor**
3. `supabase/schema.sql` 파일 전체 복사
4. 붙여넣기 후 **Run** 클릭
5. ✅ Table Editor에서 테이블 생성 확인

### 3️⃣ 환경 변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**값 찾기**: Supabase Dashboard > Settings > API

### 4️⃣ 개발 서버 실행

```bash
npm run dev
```

### 5️⃣ Python 서버 설정 (별도 터미널)

```bash
cd python-server-example
pip install -r requirements.txt
cp .env.example .env
# .env 파일에 Supabase 값 입력
python main.py
```

### 6️⃣ 타입 생성 (선택사항)

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
```

**Project ID**: Supabase Dashboard > Settings > General > Reference ID

---

## ✅ 체크리스트

- [ ] 패키지 설치 완료
- [ ] SQL 스크립트 실행 완료
- [ ] 테이블 생성 확인
- [ ] `.env.local` 파일 생성 및 값 입력
- [ ] 개발 서버 실행 성공
- [ ] Python 서버 실행 성공

---

## 📚 상세 가이드

더 자세한 내용은 `MIGRATION_GUIDE.md` 파일을 참고하세요.
