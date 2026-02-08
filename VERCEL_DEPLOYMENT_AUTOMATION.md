# 🚀 Field Nine - Vercel 자동 배포 가이드

**완성일:** 2026-01-09  
**상태:** ✅ Production Ready

---

## 📋 사전 준비사항

### 1. GitHub 저장소 확인
- 현재 프로젝트가 Git으로 관리되고 있는지 확인
- GitHub에 원격 저장소가 연결되어 있는지 확인

### 2. 환경 변수 확인
다음 환경 변수들이 `.env.local`에 설정되어 있는지 확인:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ENCRYPTION_KEY=your_encryption_key
NEXT_PUBLIC_PYTHON_SERVER_URL=your_python_server_url
```

---

## 🔄 Step 1: Git 커밋 및 푸시

### 1-1. 현재 상태 확인
```powershell
git status
```

### 1-2. 모든 변경사항 추가
```powershell
git add .
```

### 1-3. 커밋 메시지 작성
```powershell
git commit -m "feat: Orders 관리 시스템 완성 + 다크모드 지원 + Edge Case 처리"
```

### 1-4. GitHub에 푸시
```powershell
git push origin main
```
(또는 `git push origin master` - 브랜치 이름에 따라 다름)

---

## 🌐 Step 2: Vercel 배포

### 2-1. Vercel CLI 설치 확인
```powershell
vercel --version
```
설치되어 있지 않다면:
```powershell
npm install -g vercel
```

### 2-2. Vercel 로그인
```powershell
vercel login
```
브라우저가 열리면 로그인 완료

### 2-3. 프로젝트 연결
```powershell
vercel link
```
- **기존 프로젝트 사용?** → `Y` (이미 연결된 경우)
- **새 프로젝트 생성?** → `N` (처음 배포하는 경우)
- **프로젝트 이름:** `field-nine-solutions` (또는 원하는 이름)
- **프레임워크:** `Next.js` (자동 감지)
- **설정:** 기본값 유지

### 2-4. 환경 변수 자동 등록 (PowerShell 스크립트)

**방법 1: 자동 스크립트 실행**
```powershell
# 스크립트가 있다면 실행
.\scripts\add-all-vercel-env.ps1
```

**방법 2: 수동 등록**
각 환경 변수를 Production, Preview, Development에 등록:

```powershell
# Production 환경
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# (값 입력)

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# (값 입력)

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# (값 입력)

vercel env add ENCRYPTION_KEY production
# (값 입력)

vercel env add NEXT_PUBLIC_PYTHON_SERVER_URL production
# (값 입력)
```

**중요:** Preview와 Development 환경에도 동일하게 등록하려면:
```powershell
vercel env add [KEY] preview
vercel env add [KEY] development
```

### 2-5. 프로덕션 배포
```powershell
vercel --prod --yes
```

`--yes` 플래그는 확인 없이 바로 배포합니다.

---

## ✅ Step 3: 배포 확인

### 3-1. 배포 URL 확인
배포 완료 후 터미널에 표시되는 URL 확인:
```
✅ Production: https://field-nine-solutions.vercel.app
```

### 3-2. 사이트 접속 테스트
1. 배포된 URL로 접속
2. 로그인 페이지 확인
3. 대시보드 접속 확인
4. Orders 페이지 접속 확인
5. 다크모드 토글 버튼 확인 (사이드바 하단)

### 3-3. 기능 테스트 체크리스트
- [ ] 로그인/회원가입 작동
- [ ] 대시보드 데이터 표시
- [ ] Orders 페이지 로드
- [ ] 주문 검색/필터 작동
- [ ] 다크모드 전환 작동
- [ ] 에러 메시지 표시 (네트워크 오류 시)

---

## 🔄 Step 4: GitHub 연동 (자동 배포 설정)

### 4-1. Vercel 대시보드에서 연동
1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings** → **Git** 메뉴
4. **Connect Git Repository** 클릭
5. GitHub 저장소 선택 및 연결

### 4-2. 자동 배포 활성화
- **Production Branch:** `main` (또는 `master`)
- **Automatic Deployments:** 활성화
- **Preview Deployments:** 활성화

### 4-3. 테스트
```powershell
# 작은 변경사항 커밋
git commit --allow-empty -m "test: 자동 배포 테스트"
git push origin main
```

Vercel 대시보드에서 자동으로 배포가 시작되는지 확인

---

## 🛠️ Step 5: 도메인 연결 (선택사항)

### 5-1. Vercel에서 도메인 추가
1. Vercel 대시보드 → 프로젝트 → **Settings** → **Domains**
2. **Add Domain** 클릭
3. 도메인 입력: `fieldnine.io` 또는 `www.fieldnine.io`

### 5-2. DNS 설정
도메인 제공업체에서 다음 DNS 레코드 추가:

**A 레코드:**
```
Type: A
Name: @
Value: 76.76.21.21
```

**CNAME 레코드:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### 5-3. DNS 전파 대기
- 보통 5분 ~ 24시간 소요
- [whatsmydns.net](https://www.whatsmydns.net)에서 확인 가능

---

## 🐛 문제 해결

### 문제 1: 환경 변수 누락
**증상:** 배포 후 "Application error" 발생

**해결:**
1. Vercel 대시보드 → 프로젝트 → **Settings** → **Environment Variables**
2. 모든 환경 변수가 등록되어 있는지 확인
3. Production, Preview, Development 모두 확인
4. 재배포: `vercel --prod`

### 문제 2: 빌드 실패
**증상:** `npm run build` 실패

**해결:**
```powershell
# 로컬에서 빌드 테스트
npm run build

# 에러 확인 후 수정
# TypeScript 에러가 있다면 타입 수정
# 의존성 문제가 있다면 package.json 확인
```

### 문제 3: Git 푸시 실패
**증상:** `git push` 실패

**해결:**
```powershell
# 원격 저장소 확인
git remote -v

# 원격 저장소가 없다면 추가
git remote add origin https://github.com/YOUR_USERNAME/field-nine-solutions.git

# 또는 SSH 사용
git remote add origin git@github.com:YOUR_USERNAME/field-nine-solutions.git
```

### 문제 4: 다크모드가 작동하지 않음
**증상:** 다크모드 토글 버튼 클릭해도 변화 없음

**해결:**
1. 브라우저 콘솔에서 에러 확인 (F12)
2. `localStorage` 확인: `localStorage.getItem("darkMode")`
3. `document.documentElement.classList.contains("dark")` 확인
4. CSS 변수가 제대로 정의되어 있는지 확인

---

## 📊 배포 상태 모니터링

### Vercel 대시보드
- **Deployments:** 배포 이력 확인
- **Analytics:** 트래픽 및 성능 모니터링
- **Logs:** 실시간 로그 확인

### 로컬 로그 확인
```powershell
# Vercel CLI로 로그 확인
vercel logs
```

---

## 🎯 완료 체크리스트

- [ ] Git 커밋 및 푸시 완료
- [ ] Vercel 프로젝트 연결 완료
- [ ] 환경 변수 등록 완료 (5개 모두)
- [ ] 프로덕션 배포 완료
- [ ] 사이트 접속 확인
- [ ] 주요 기능 테스트 완료
- [ ] 다크모드 작동 확인
- [ ] GitHub 자동 배포 연동 (선택)
- [ ] 도메인 연결 (선택)

---

## 🚀 다음 단계

1. **모니터링 설정**
   - Vercel Analytics 활성화
   - 에러 추적 도구 연동 (Sentry 등)

2. **성능 최적화**
   - 이미지 최적화
   - 코드 스플리팅
   - 캐싱 전략

3. **보안 강화**
   - API Rate Limiting
   - CORS 설정
   - 보안 헤더 추가

---

**배포 완료! 🎉**

Field Nine이 이제 전 세계에서 접근 가능합니다!
