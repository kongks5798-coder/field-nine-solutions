# 🚀 Field Nine Solutions - 실전 배포 명령어 가이드

**fieldnine.io 도메인 배포 완전 가이드**

---

## 📋 사전 준비사항

### 필수 정보
- ✅ GitHub 리포지토리 URL
- ✅ Supabase 프로젝트 URL 및 API Keys
- ✅ `ENCRYPTION_KEY` (64자 hex 문자열)
- ✅ 도메인 등록 업체 DNS 관리 권한

---

## 🔧 1단계: 로컬 빌드 확인

배포 전에 로컬에서 빌드가 성공하는지 확인:

```bash
# 프로젝트 루트에서 실행
cd c:\Users\polor\field-nine-solutions
npm run build
```

**✅ "Compiled successfully" 메시지가 나오면 다음 단계로 진행**

---

## 📦 2단계: Vercel CLI 설치 및 로그인

### 2-1. Vercel CLI 설치 (최초 1회)

```bash
npm install -g vercel
```

### 2-2. Vercel 로그인 (최초 1회)

```bash
vercel login
```

**브라우저가 열리면 GitHub 계정으로 로그인하세요.**

---

## 🚀 3단계: 프로덕션 배포

### 3-1. 프로젝트 배포 (프로덕션)

```bash
# 프로젝트 루트에서 실행
vercel --prod
```

**질문에 답변:**
1. **Set up and deploy?** → `Y` (Yes)
2. **Which scope?** → 본인의 계정 선택
3. **Link to existing project?** → `N` (No, 새 프로젝트 생성) 또는 `Y` (기존 프로젝트 연결)
4. **What's your project's name?** → `field-nine-solutions` (또는 원하는 이름)
5. **In which directory is your code located?** → `./` (현재 디렉토리)
6. **Override settings?** → `N` (No, 기본 설정 사용)

**배포가 완료되면 임시 URL이 제공됩니다:**
```
https://field-nine-solutions.vercel.app
```

---

## 🔐 4단계: 환경 변수 설정

### 4-1. Vercel 대시보드 접속

1. https://vercel.com/dashboard 접속
2. 방금 생성한 프로젝트 클릭
3. **Settings** 탭 클릭
4. **Environment Variables** 메뉴 클릭

### 4-2. 환경 변수 추가

다음 환경 변수들을 **모두 추가**하세요:

```bash
# 복사하여 Vercel 대시보드에 붙여넣기

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
ENCRYPTION_KEY=your-64-character-hex-encryption-key-here
NEXT_PUBLIC_PYTHON_SERVER_URL=https://your-python-server.com
```

**각 변수 추가 시:**
- ✅ **Production, Preview, Development** 모두 체크
- ✅ **Save** 버튼 클릭

### 4-3. 환경 변수 적용을 위한 재배포

환경 변수를 추가한 후 자동으로 재배포되지만, 수동으로 재배포하려면:

```bash
vercel --prod
```

또는 Vercel 대시보드에서 **Deployments** 탭 > **Redeploy** 버튼 클릭

---

## 🌐 5단계: 도메인 연결 (fieldnine.io)

### 5-1. Vercel에서 도메인 추가

1. **Vercel 대시보드 > 프로젝트 > Settings** 탭
2. **Domains** 메뉴 클릭
3. **Add Domain** 버튼 클릭
4. `fieldnine.io` 입력 후 **Add** 클릭
5. **또는 서브도메인 사용:** `www.fieldnine.io` 입력

### 5-2. DNS 설정 (도메인 등록 업체에서)

도메인 등록 업체(예: GoDaddy, Namecheap, Cloudflare)의 DNS 관리 페이지로 이동:

#### 방법 1: A 레코드 사용 (권장)

**Vercel이 제공하는 IP 주소:**
```
76.76.21.21
```

**DNS 설정:**
| 타입 | 이름 | 값 | TTL |
|------|------|-----|-----|
| A | @ (또는 비워두기) | `76.76.21.21` | 3600 |

**또는 CNAME 사용:**

**Vercel이 제공하는 CNAME:**
```
cname.vercel-dns.com
```

**DNS 설정:**
| 타입 | 이름 | 값 | TTL |
|------|------|-----|-----|
| CNAME | @ (또는 비워두기) | `cname.vercel-dns.com` | 3600 |

**⚠️ 중요:** Vercel 대시보드 > **Domains** > `fieldnine.io` 클릭하면 **정확한 DNS 설정 값**이 표시됩니다. 그 값을 사용하세요!

### 5-3. DNS 전파 대기

DNS 변경 후 전파까지 **최대 48시간** 소요될 수 있습니다 (보통 1-2시간).

**확인 방법:**
```bash
# 터미널에서 실행
nslookup fieldnine.io
```

또는 온라인 도구 사용:
- https://dnschecker.org
- https://www.whatsmydns.net

### 5-4. SSL 인증서 자동 발급

Vercel이 자동으로 SSL 인증서를 발급합니다 (Let's Encrypt).  
**Settings > Domains**에서 **Valid** 상태가 되면 완료입니다.

---

## ✅ 6단계: 배포 확인

### 6-1. 배포 상태 확인

Vercel 대시보드 > **Deployments** 탭에서:
- ✅ **Ready** 상태 확인
- ✅ **Production** 브랜치 확인

### 6-2. 사이트 접속 테스트

1. **임시 URL:** `https://field-nine-solutions.vercel.app`
2. **도메인 URL:** `https://fieldnine.io` (DNS 전파 후)

### 6-3. 기능 테스트

- [ ] 홈페이지 로드 확인
- [ ] 로그인 기능 (Google/Kakao)
- [ ] 대시보드 접속
- [ ] 주문 동기화 기능

---

## 🔄 7단계: 자동 배포 설정 (GitHub 연동)

### 7-1. GitHub 리포지토리 연결

1. Vercel 대시보드 > 프로젝트 > **Settings** > **Git**
2. **Connect Git Repository** 클릭
3. GitHub 리포지토리 선택 및 연결

### 7-2. 자동 배포 활성화

- **Production Branch:** `main` (또는 `master`)
- **Preview Deployments:** 활성화 (PR마다 미리보기 배포)

**이제 `main` 브랜치에 푸시하면 자동으로 배포됩니다!**

---

## 📝 빠른 배포 명령어 요약

```bash
# 1. 로컬 빌드 확인
npm run build

# 2. Vercel 로그인 (최초 1회)
vercel login

# 3. 프로덕션 배포
vercel --prod

# 4. 환경 변수는 Vercel 대시보드에서 설정
# 5. 도메인은 Vercel 대시보드 > Settings > Domains에서 추가
```

---

## 🐛 문제 해결

### 문제 1: 빌드 실패

**해결:**
```bash
# 로컬에서 빌드 테스트
npm run build

# 타입 에러 확인
npm run type-check  # (있다면)
```

### 문제 2: 환경 변수 누락

**해결:**
- Vercel 대시보드 > **Settings** > **Environment Variables** 확인
- 모든 변수가 **Production, Preview, Development**에 체크되어 있는지 확인

### 문제 3: 도메인 연결 실패

**해결:**
- DNS 설정이 올바른지 확인 (A 레코드 또는 CNAME)
- DNS 전파 대기 (최대 48시간)
- Vercel 대시보드의 DNS 가이드 재확인

### 문제 4: OAuth 로그인 실패

**해결:**
1. Supabase Dashboard > **Authentication** > **URL Configuration**
2. **Site URL:** `https://fieldnine.io`
3. **Redirect URLs:** `https://fieldnine.io/auth/callback`

---

## 🎉 배포 완료!

이제 **https://fieldnine.io** 에서 서비스를 이용할 수 있습니다!

**추가 질문이나 문제가 있으면:**
- Vercel 문서: https://vercel.com/docs
- Supabase 문서: https://supabase.com/docs

---

**성공을 기원합니다! 🚀**
