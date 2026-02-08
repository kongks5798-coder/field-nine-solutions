# 🔧 Vercel 환경변수 설정 완벽 가이드

## 📋 단계별 상세 안내

### Step 1: Vercel 대시보드 접속

1. **브라우저에서 Vercel 접속**
   ```
   https://vercel.com
   ```

2. **로그인**
   - GitHub 계정으로 로그인 (또는 기존 계정)

---

### Step 2: 프로젝트 선택

1. **대시보드에서 프로젝트 찾기**
   - 프로젝트 이름: `field-nine-solutions`
   - 또는 `field-time-solutions` (실제 프로젝트 이름 확인)

2. **프로젝트 클릭**
   - 프로젝트 카드를 클릭하여 프로젝트 페이지로 이동

---

### Step 3: Settings 메뉴로 이동

1. **상단 네비게이션 바 확인**
   - Overview, Deployments, Analytics, Logs, **Settings** 등이 보임

2. **Settings 클릭**
   - 상단 네비게이션 바에서 **Settings** 탭 클릭

---

### Step 4: Environment Variables 섹션 찾기

1. **왼쪽 사이드바 확인**
   - Settings 페이지의 왼쪽에 메뉴가 있음
   - **Environment Variables** 항목 찾기

2. **Environment Variables 클릭**
   - 왼쪽 사이드바에서 **Environment Variables** 클릭

---

### Step 5: 환경변수 추가

#### 5-1. "Create new" 탭 확인
- 기본적으로 **"Create new"** 탭이 선택되어 있음

#### 5-2. Key 입력
1. **Key 필드에 입력**
   ```
   NEXT_PUBLIC_ARBITRAGE_API_URL
   ```
   - 정확히 위와 같이 입력 (대소문자 구분)

#### 5-3. Value 입력
1. **Value 필드에 입력**
   ```
   https://field-nine-solutions.vercel.app
   ```
   - ⚠️ **주의**: 실제 배포된 URL로 변경 필요!
   - Vercel 대시보드의 Deployments 탭에서 실제 URL 확인

#### 5-4. Environments 선택
1. **"Environments" 드롭다운 클릭**
   - 기본값: "All Environments" (권장)
   - 또는 특정 환경 선택:
     - Production
     - Preview
     - Development

#### 5-5. Sensitive 설정 (선택사항)
- **Disabled** 선택 (기본값)
- 민감한 정보가 아니므로 Disabled로 유지

#### 5-6. Note 입력 (선택사항)
```
차익거래 엔진 API URL 설정
프론트엔드에서 API 호출 시 사용
```

---

### Step 6: 저장

1. **Save 버튼 클릭**
   - 화면 하단 오른쪽의 검은색 **Save** 버튼 클릭

2. **저장 확인**
   - 환경변수가 목록에 추가됨
   - ✅ 표시로 저장 완료 확인

---

### Step 7: 추가 환경변수 설정 (필요한 경우)

다음 환경변수도 추가할 수 있습니다:

#### 7-1. DeepSeek API Key (선택사항)
- **Key**: `DEEPSEEK_API_KEY`
- **Value**: `sk-...` (실제 API 키)
- **Sensitive**: ✅ **Enabled** (체크!)
- **Environments**: All Environments

#### 7-2. 데이터베이스 URL (선택사항)
- **Key**: `DATABASE_URL`
- **Value**: `postgresql://...` (실제 DB URL)
- **Sensitive**: ✅ **Enabled**
- **Environments**: All Environments

#### 7-3. Redis URL (선택사항)
- **Key**: `REDIS_URL`
- **Value**: `redis://...` (실제 Redis URL)
- **Sensitive**: ✅ **Enabled**
- **Environments**: All Environments

---

### Step 8: Redeploy 실행

⚠️ **중요**: 환경변수 변경 후 반드시 Redeploy 필요!

#### 방법 1: Deployments 탭에서
1. 상단 네비게이션에서 **Deployments** 클릭
2. 최신 배포 항목의 **...** (점 3개) 메뉴 클릭
3. **Redeploy** 선택
4. 확인 대화상자에서 **Redeploy** 클릭

#### 방법 2: 자동 배포
- GitHub에 새로운 커밋 푸시하면 자동으로 재배포됨

---

## 📸 스크린샷 가이드

### 환경변수 추가 화면 구성

```
┌─────────────────────────────────────────┐
│ Environment Variables                    │
├─────────────────────────────────────────┤
│                                         │
│  [Create new] [Link Shared]            │
│                                         │
│  Sensitive:                             │
│  ○ Disabled  ● Enabled                 │
│                                         │
│  Environments:                          │
│  [All Environments ▼]                   │
│                                         │
│  Key:                                   │
│  [NEXT_PUBLIC_ARBITRAGE_API_URL    ]   │
│                                         │
│  Value:                                 │
│  [https://your-app.vercel.app       ]   │
│                                         │
│  Note:                                  │
│  [차익거래 엔진 API URL 설정        ]   │
│                                         │
│  [Add Another] [Import .env]            │
│                                         │
│  ☑ Automatically expose System...      │
│                                         │
│                              [Save]     │
└─────────────────────────────────────────┘
```

---

## ✅ 확인 체크리스트

배포 전 확인:

- [ ] Vercel 대시보드 접속 완료
- [ ] 프로젝트 선택 완료
- [ ] Settings → Environment Variables 이동 완료
- [ ] `NEXT_PUBLIC_ARBITRAGE_API_URL` 추가 완료
- [ ] 실제 배포 URL로 Value 설정 완료
- [ ] Environments: All Environments 선택 완료
- [ ] Save 버튼 클릭 완료
- [ ] 환경변수 목록에 추가 확인 완료
- [ ] Redeploy 실행 완료

---

## 🚨 주의사항

### 1. 실제 URL 확인 필수
- Value에 입력하는 URL은 실제 배포된 URL이어야 함
- Vercel 대시보드의 Deployments 탭에서 확인

### 2. Redeploy 필수
- 환경변수 변경 후 반드시 Redeploy 실행
- 그렇지 않으면 변경사항이 적용되지 않음

### 3. NEXT_PUBLIC_ 접두사
- `NEXT_PUBLIC_`로 시작하는 환경변수만 클라이언트에서 접근 가능
- 서버 전용 변수는 `NEXT_PUBLIC_` 없이 설정

### 4. Sensitive 설정
- API 키, 비밀번호 등은 **Sensitive: Enabled**로 설정
- 설정 후에는 Value를 다시 볼 수 없음

---

## 🔍 실제 배포 URL 확인 방법

### 방법 1: Deployments 탭
1. Vercel 대시보드에서 **Deployments** 클릭
2. 최신 배포 항목 확인
3. **Domains** 섹션에서 URL 확인
   - 예: `field-nine-solutions.vercel.app`

### 방법 2: Overview 탭
1. 프로젝트 **Overview** 탭
2. 상단에 배포 URL 표시됨

---

## 📝 예시: 완성된 환경변수 설정

```
Key: NEXT_PUBLIC_ARBITRAGE_API_URL
Value: https://field-nine-solutions.vercel.app
Environments: All Environments
Sensitive: Disabled
Note: 차익거래 엔진 API URL 설정
```

---

## 🎯 빠른 참조

### 필수 환경변수
```
NEXT_PUBLIC_ARBITRAGE_API_URL=https://your-app.vercel.app
```

### 선택적 환경변수
```
DEEPSEEK_API_KEY=sk-...
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
```

---

**보스, 이 가이드대로 따라하시면 완벽하게 설정됩니다!** ✅

단계별로 천천히 따라하시면 됩니다! 🚀
