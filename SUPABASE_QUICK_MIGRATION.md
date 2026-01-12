# ⚡ Supabase 프로 플랜으로 빠르게 이동하기

## 🎯 3단계로 완료!

### 1단계: 프로 플랜 조직에서 새 프로젝트 만들기 (3분)

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard 접속

2. **프로 플랜 조직 선택**
   - **"kongks5798@gmail.com"** (프로 플랜 • 5개 프로젝트) 클릭

3. **새 프로젝트 생성**
   - **"+ 새로운 프로젝트"** 버튼 클릭
   - **이름:** `field-nine-solutions` 입력
   - **비밀번호:** 설정 (기억해두세요!)
   - **리전:** `ap-northeast-1` (서울) 선택
   - **"새 프로젝트 생성"** 클릭
   - ⏳ 2-3분 대기

---

### 2단계: 프로젝트 정보 복사 및 Vercel 업데이트 (2분)

#### 2-1. Supabase에서 정보 복사

1. 새로 만든 프로젝트 선택
2. **Settings** → **API** 클릭
3. 다음 두 가지 복사:
   - **Project URL:** `https://xxxxx.supabase.co` (복사)
   - **anon public 키:** 긴 문자열 (복사)

#### 2-2. Vercel 환경 변수 업데이트

1. **Vercel 대시보드 접속**
   - https://vercel.com 접속
   - `field-nine-solutions` 프로젝트 선택

2. **Settings → Environment Variables** 클릭

3. **NEXT_PUBLIC_SUPABASE_URL 수정**
   - 기존 변수 클릭
   - **Value**를 새 프로젝트 URL로 변경
   - **"Save"** 클릭

4. **NEXT_PUBLIC_SUPABASE_ANON_KEY 수정**
   - 기존 변수 클릭
   - **Value**를 새 프로젝트 anon 키로 변경
   - **"Save"** 클릭

---

### 3단계: 스키마 실행 (3분)

1. **Supabase SQL Editor 열기**
   - 새 프로젝트에서 **SQL Editor** 클릭
   - **"New query"** 클릭

2. **첫 번째 스키마 실행**
   - `supabase/schema.sql` 파일 열기
   - 전체 복사 (Ctrl+A, Ctrl+C)
   - SQL Editor에 붙여넣기 (Ctrl+V)
   - **"Run"** 클릭
   - ✅ 성공 확인

3. **두 번째 스키마 실행**
   - **"New query"** 다시 클릭
   - `supabase/schema_subscriptions.sql` 파일 열기
   - 전체 복사
   - 붙여넣기
   - **"Run"** 클릭
   - ✅ 성공 확인

---

## ✅ 완료!

이제 프로 플랜을 사용하고 있습니다!

### 확인 방법:

1. **헬스 체크**
   ```
   https://fieldnine.io/api/health
   ```
   - 데이터베이스가 "healthy"로 표시되면 성공

2. **Vercel 자동 재배포**
   - 환경 변수 변경 후 자동으로 재배포됩니다
   - 약 2-3분 소요

---

## 📋 빠른 체크리스트

- [ ] 프로 플랜 조직 선택
- [ ] 새 프로젝트 생성
- [ ] URL과 키 복사
- [ ] Vercel 환경 변수 2개 업데이트
- [ ] 스키마 2개 실행
- [ ] 헬스 체크 확인

**총 소요 시간: 약 8분** ⏱️

---

**보스, 이렇게 하면 프로 플랜으로 완벽하게 이동합니다!** 🚀
