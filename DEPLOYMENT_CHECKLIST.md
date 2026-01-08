# ✅ 배포 전 체크리스트

## 🔍 빌드 확인

- [x] `npm run build` 성공
- [x] TypeScript 오류 없음
- [x] ESLint 경고 없음

## 🔐 환경 변수 확인

배포 전 다음 환경 변수가 설정되어 있는지 확인:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

## 🗄️ 데이터베이스 확인

- [ ] Supabase 마이그레이션 실행 완료
  - `supabase/migrations/009_oms_core_schema.sql`
- [ ] RLS 정책 적용 확인
- [ ] 테이블 생성 확인

## 🔒 보안 확인

- [ ] 환경 변수 `.env.local`이 `.gitignore`에 포함됨
- [ ] API Key가 코드에 하드코딩되지 않음
- [ ] 민감한 정보가 GitHub에 올라가지 않음

## 📱 기능 테스트

- [ ] 로그인 기능 작동
- [ ] 대시보드 접속 가능
- [ ] 주문 목록 조회 가능
- [ ] API 엔드포인트 정상 작동

## 🚀 배포 준비

- [ ] `vercel.json` 파일 생성 완료
- [ ] `README.md` 업데이트 완료
- [ ] 배포 가이드 문서 작성 완료

---

**모든 체크리스트를 완료하면 배포를 진행하세요!** ✅
