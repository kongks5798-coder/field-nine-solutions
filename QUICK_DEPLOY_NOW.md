# 🚀 fieldnine.io 즉시 배포 가이드

**현재 상태:** fieldnine.io는 아직 배포되지 않았습니다.

---

## ⚡ 빠른 배포 (5분 안에 완료)

### 1단계: Vercel CLI 설치

```bash
npm install -g vercel
```

### 2단계: Vercel 로그인

```bash
vercel login
```

브라우저가 열리면 GitHub 계정으로 로그인하세요.

### 3단계: 프로덕션 배포

```bash
cd c:\Users\polor\field-nine-solutions
vercel --prod
```

**질문에 답변:**
- Set up and deploy? → `Y`
- Link to existing project? → `N` (새 프로젝트)
- Project name? → `field-nine-solutions`
- Directory? → `./`

### 4단계: 환경 변수 설정

1. Vercel 대시보드 접속: https://vercel.com/dashboard
2. 프로젝트 클릭 > **Settings** > **Environment Variables**
3. 다음 변수 추가 (Production, Preview, Development 모두 체크):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ENCRYPTION_KEY=your-64-character-hex-key
NEXT_PUBLIC_PYTHON_SERVER_URL=https://your-python-server.com
```

### 5단계: 도메인 연결

1. Vercel 대시보드 > **Settings** > **Domains**
2. **Add Domain** 클릭
3. `fieldnine.io` 입력
4. DNS 설정 안내를 따라 도메인 등록 업체에서 설정

---

## 📝 상세 가이드

자세한 내용은 `DEPLOY_COMMANDS_FIELDNINE.md` 파일을 참고하세요.

---

## ✅ 배포 확인

배포 완료 후:
```bash
# 브라우저로 열기
start https://fieldnine.io
```
