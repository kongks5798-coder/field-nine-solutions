# ⚡ 빠른 배포 명령어 (터미널 사용자용)

## 방법 1: Vercel CLI 사용 (가장 빠름)

### 1. Vercel CLI 설치
```powershell
npm install -g vercel
```

### 2. 프로젝트 폴더에서 로그인
```powershell
cd C:\Users\polor\field-nine-solutions
vercel login
```
- 브라우저가 열리면 GitHub로 로그인

### 3. 배포
```powershell
vercel
```
- 질문이 나오면:
  - **"Set up and deploy?** → `Y` 입력
  - **"Which scope?** → 본인 계정 선택
  - **"Link to existing project?** → `N` 입력 (처음 배포)
  - **"What's your project's name?** → `field-nine-solutions` 입력
  - **"In which directory is your code located?** → `./` 입력 (그대로 Enter)

### 4. 환경 변수 설정
```powershell
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Supabase URL 입력

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Supabase Anon Key 입력

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Supabase Service Role Key 입력
```

### 5. 프로덕션 배포
```powershell
vercel --prod
```

---

## 방법 2: GitHub 연동 (자동 배포)

### 1. GitHub에 코드 올리기
```powershell
cd C:\Users\polor\field-nine-solutions
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/field-nine-solutions.git
git push -u origin main
```

### 2. Vercel 웹사이트에서 배포
1. https://vercel.com 접속
2. **"Add New..."** → **"Project"** 클릭
3. GitHub 저장소 선택
4. 환경 변수 설정
5. **"Deploy"** 클릭

**장점**: GitHub에 코드를 푸시하면 자동으로 재배포됨!

---

## 🎯 배포 후 확인

배포가 완료되면 다음 URL로 접속 가능:
```
https://field-nine-solutions.vercel.app
```

또는 Vercel이 자동으로 생성한 URL:
```
https://field-nine-solutions-[랜덤문자].vercel.app
```

---

## 🔄 재배포

코드를 수정한 후 다시 배포하려면:

**Vercel CLI 사용:**
```powershell
vercel --prod
```

**GitHub 연동 시:**
- GitHub에 푸시하면 자동으로 재배포됨!

---

**문제가 생기면 `vercel logs` 명령어로 로그를 확인하세요!** 📋
