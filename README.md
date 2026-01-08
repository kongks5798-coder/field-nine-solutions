# Field Nine Solutions - 상용 OMS (주문관리시스템)

온라인 셀러를 위한 올인원 주문관리시스템 SaaS 솔루션

## 🚀 빠른 시작

### 로컬 개발 환경 설정

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **환경 변수 설정**
   `.env.local` 파일을 생성하고 다음 변수를 설정하세요:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **개발 서버 실행**
   ```bash
   npm run dev
   ```

4. **브라우저에서 확인**
   - http://localhost:3000 접속

---

## 📦 배포

### Vercel 배포

자세한 배포 가이드는 [`DEPLOYMENT_GUIDE_VERCEL.md`](./DEPLOYMENT_GUIDE_VERCEL.md)를 참고하세요.

**간단한 배포 명령어:**
```bash
# Vercel CLI 설치 (처음 한 번만)
npm i -g vercel

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

---

## 🗄️ 데이터베이스 설정

### Supabase 마이그레이션 실행

1. Supabase Dashboard 접속: https://app.supabase.com
2. 프로젝트 선택
3. **SQL Editor** 클릭
4. **New Query** 클릭
5. `supabase/migrations/009_oms_core_schema.sql` 파일 내용 복사하여 붙여넣기
6. **Run** 버튼 클릭

---

## 📁 프로젝트 구조

```
field-nine-solutions/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── orders/        # 주문 동기화 API
│   │   └── dashboard/     # 대시보드 통계 API
│   ├── dashboard/         # 대시보드 페이지
│   └── login/             # 로그인 페이지
├── src/
│   ├── components/        # React 컴포넌트
│   ├── utils/             # 유틸리티 함수
│   └── hooks/             # React Hooks
├── supabase/
│   └── migrations/        # 데이터베이스 마이그레이션
└── public/                 # 정적 파일
```

---

## 🔑 주요 기능

- ✅ Google/Kakao OAuth 로그인
- ✅ 이메일/비밀번호 로그인
- ✅ 주문 동기화 (Python 서버 연동)
- ✅ 실시간 대시보드 통계
- ✅ 주문 관리 (TanStack Table)
- ✅ 상품 마스터 관리
- ✅ 재고 관리
- ✅ 수익 분석

---

## 🛠️ 기술 스택

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Charts**: Recharts
- **Tables**: TanStack Table

---

## 📚 문서

- [배포 가이드](./DEPLOYMENT_GUIDE_VERCEL.md)
- [프로젝트 상태 감사](./PROJECT_STATUS_AUDIT_REPORT.md)
- [정밀 진단 성적표](./FINAL_AUDIT_SCORECARD.md)
- [API 구현 완료 보고](./PHASE2_2_API_IMPLEMENTATION_COMPLETE.md)

---

## 📝 라이선스

Private - All Rights Reserved
