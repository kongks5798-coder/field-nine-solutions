# ✅ 배포 빠른 체크리스트

## 1단계: Vercel 설정 (5분)

- [ ] Vercel.com 접속 → GitHub로 로그인
- [ ] "Add New Project" 클릭
- [ ] "field-nine-solutions" 선택 → Import
- [ ] 프로젝트 설정 확인 (Next.js 자동 감지)

## 2단계: 환경 변수 추가 (3분)

Vercel → Settings → Environment Variables에서 추가:

- [ ] `NEXT_PUBLIC_SUPABASE_URL` = Supabase 프로젝트 URL
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Supabase anon 키
- [ ] `PYTHON_BACKEND_URL` = Python 백엔드 URL

**중요:** 각 변수마다 Production, Preview, Development 모두 체크!

## 3단계: Supabase 설정 (5분)

- [ ] Supabase.com 접속 → 새 프로젝트 생성
- [ ] Settings → API에서 URL과 키 복사
- [ ] SQL Editor → New Query
- [ ] `supabase/schema.sql` 내용 복사 → 붙여넣기 → Run
- [ ] New Query → `supabase/schema_subscriptions.sql` 내용 복사 → 붙여넣기 → Run

## 4단계: 배포 실행 (2분)

- [ ] Vercel 프로젝트 설정 화면으로 돌아가기
- [ ] 환경 변수 다시 확인
- [ ] "Deploy" 버튼 클릭
- [ ] 2-5분 대기

## 5단계: 확인 (1분)

- [ ] 배포 완료 후 "Visit" 버튼 클릭
- [ ] 사이트가 열리는지 확인
- [ ] `/api/health` 접속해서 헬스 체크 확인

---

## 🚨 문제 발생 시

### 오류: "Environment Variable not found"
→ Vercel Settings → Environment Variables에서 모든 변수 확인

### 오류: "Build failed"
→ Vercel Deployments → Logs에서 오류 메시지 확인

### 오류: "Database connection error"
→ Supabase 프로젝트 활성화 확인 + 환경 변수 재확인

---

**총 소요 시간: 약 15분** ⏱️
