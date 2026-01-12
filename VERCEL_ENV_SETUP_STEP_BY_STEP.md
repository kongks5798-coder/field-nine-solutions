# 📖 Vercel 환경변수 설정 단계별 완벽 가이드

## 🎯 목표
Vercel에 환경변수를 설정하여 차익거래 엔진이 정상 작동하도록 합니다.

---

## 📋 사전 준비

### 1. 필요한 정보 확인
- ✅ Vercel 계정 (GitHub 로그인)
- ✅ 배포된 프로젝트 URL 확인

---

## 🚀 Step-by-Step 가이드

### Step 1: Vercel 대시보드 접속 (30초)

1. **브라우저 열기**
   - Chrome, Edge, Firefox 등 아무 브라우저

2. **Vercel 접속**
   ```
   https://vercel.com
   ```

3. **로그인**
   - "Continue with GitHub" 클릭
   - GitHub 계정으로 로그인

4. **대시보드 확인**
   - 로그인 후 자동으로 대시보드로 이동
   - 프로젝트 목록이 보임

**✅ Step 1 완료 확인:**
- [ ] Vercel 대시보드에 접속됨
- [ ] 프로젝트 목록이 보임

---

### Step 2: 프로젝트 선택 (10초)

1. **프로젝트 찾기**
   - 프로젝트 이름: `field-nine-solutions`
   - 또는 `field-time-solutions` (실제 이름 확인)

2. **프로젝트 클릭**
   - 프로젝트 카드를 클릭
   - 프로젝트 상세 페이지로 이동

**✅ Step 2 완료 확인:**
- [ ] 프로젝트 상세 페이지로 이동됨
- [ ] 상단에 Overview, Deployments, Settings 등 메뉴가 보임

---

### Step 3: Settings 메뉴로 이동 (5초)

1. **상단 네비게이션 확인**
   ```
   [Overview] [Deployments] [Analytics] ... [Settings]
   ```

2. **Settings 클릭**
   - 상단 네비게이션 바에서 **Settings** 탭 클릭

**✅ Step 3 완료 확인:**
- [ ] Settings 페이지로 이동됨
- [ ] 왼쪽에 사이드바 메뉴가 보임

---

### Step 4: Environment Variables 찾기 (5초)

1. **왼쪽 사이드바 확인**
   - Settings 페이지 왼쪽에 메뉴 목록이 있음

2. **Environment Variables 찾기**
   - 사이드바에서 **Environment Variables** 항목 찾기
   - 아래와 같은 메뉴 구조:
     ```
     General
     Build and Deployment
     Domains
     Environments
     Git
     Integrations
     ...
     Environment Variables  ← 여기!
     ...
     ```

3. **Environment Variables 클릭**
   - **Environment Variables** 클릭

**✅ Step 4 완료 확인:**
- [ ] Environment Variables 페이지로 이동됨
- [ ] "Environment Variables" 제목이 보임
- [ ] "Create new" 탭이 보임

---

### Step 5: 실제 배포 URL 확인 (30초)

⚠️ **중요**: 환경변수 Value에 실제 배포 URL을 입력해야 합니다!

#### 방법 A: Deployments 탭에서 확인
1. 상단 네비게이션에서 **Deployments** 클릭
2. 최신 배포 항목 확인
3. **Domains** 섹션에서 URL 확인
   - 예: `field-nine-solutions.vercel.app`
   - 또는 `field-nine-solutions-[hash].vercel.app`

#### 방법 B: Overview 탭에서 확인
1. 상단 네비게이션에서 **Overview** 클릭
2. 상단에 배포 URL이 표시됨
3. URL 복사

**✅ Step 5 완료 확인:**
- [ ] 실제 배포 URL을 확인함
- [ ] URL을 복사하거나 메모함
- [ ] 예: `https://field-nine-solutions.vercel.app`

---

### Step 6: 환경변수 추가 (1분)

#### 6-1. "Create new" 탭 확인
- 기본적으로 **"Create new"** 탭이 선택되어 있음
- 선택되어 있지 않으면 클릭

#### 6-2. Key 입력
1. **Key 필드 클릭**
   - "Key" 라벨 아래 입력 필드 클릭

2. **정확히 입력**
   ```
   NEXT_PUBLIC_ARBITRAGE_API_URL
   ```
   - ⚠️ 대소문자 정확히 입력
   - 공백 없이 입력

#### 6-3. Value 입력
1. **Value 필드 클릭**
   - "Value" 라벨 아래 입력 필드 클릭

2. **실제 배포 URL 입력**
   ```
   https://field-nine-solutions.vercel.app
   ```
   - ⚠️ Step 5에서 확인한 실제 URL로 변경!
   - `https://` 포함하여 입력

#### 6-4. Environments 선택
1. **"Environments" 드롭다운 클릭**
   - "All Environments" 선택 (권장)
   - 또는:
     - Production: 프로덕션 환경만
     - Preview: 프리뷰 환경만
     - Development: 개발 환경만

2. **"All Environments" 선택**
   - 모든 환경에 적용되도록 설정

#### 6-5. Sensitive 설정
- **"Disabled" 선택** (기본값)
- API URL은 공개 정보이므로 Disabled로 유지

#### 6-6. Note 입력 (선택사항)
1. **Note 필드 클릭**
2. **설명 입력**
   ```
   차익거래 엔진 API URL 설정
   프론트엔드에서 API 호출 시 사용
   ```

**✅ Step 6 완료 확인:**
- [ ] Key: `NEXT_PUBLIC_ARBITRAGE_API_URL` 입력 완료
- [ ] Value: 실제 배포 URL 입력 완료
- [ ] Environments: All Environments 선택 완료
- [ ] Sensitive: Disabled 선택 완료

---

### Step 7: 저장 (5초)

1. **화면 하단 확인**
   - 오른쪽에 검은색 **Save** 버튼이 보임

2. **Save 버튼 클릭**
   - **Save** 버튼 클릭

3. **저장 확인**
   - 잠시 후 환경변수가 목록에 추가됨
   - ✅ 표시로 저장 완료 확인

**✅ Step 7 완료 확인:**
- [ ] Save 버튼 클릭 완료
- [ ] 환경변수가 목록에 추가됨
- [ ] 저장 완료 메시지 확인

---

### Step 8: Redeploy 실행 (30초)

⚠️ **중요**: 환경변수 변경 후 반드시 Redeploy 필요!

#### 방법 1: Deployments 탭에서 (권장)
1. **Deployments 탭 클릭**
   - 상단 네비게이션에서 **Deployments** 클릭

2. **최신 배포 찾기**
   - 목록 맨 위에 최신 배포가 있음

3. **... 메뉴 클릭**
   - 최신 배포 항목 오른쪽에 **...** (점 3개) 메뉴 클릭

4. **Redeploy 선택**
   - 드롭다운 메뉴에서 **Redeploy** 선택

5. **확인**
   - 확인 대화상자에서 **Redeploy** 클릭

6. **배포 진행 확인**
   - 배포 상태가 "Building" → "Ready"로 변경됨
   - 약 2-3분 소요

#### 방법 2: 자동 배포
- GitHub에 새로운 커밋 푸시하면 자동으로 재배포됨
- 하지만 환경변수만 변경한 경우 수동 Redeploy 권장

**✅ Step 8 완료 확인:**
- [ ] Redeploy 실행 완료
- [ ] 배포 상태가 "Building"으로 변경됨
- [ ] 배포 완료 대기 중 (2-3분)

---

## 🎉 완료!

### 최종 확인

1. **배포 완료 확인**
   - Deployments 탭에서 상태가 "Ready"가 되면 완료

2. **사이트 접속 테스트**
   ```
   https://your-app.vercel.app/arbitrage
   ```
   - 차익거래 페이지가 정상적으로 로드되는지 확인

3. **API 연결 확인**
   - 브라우저 개발자 도구 (F12) → Console 탭
   - API 호출 오류가 없는지 확인

---

## 📝 추가 환경변수 (선택사항)

필요한 경우 다음 환경변수도 추가할 수 있습니다:

### DeepSeek API Key
```
Key: DEEPSEEK_API_KEY
Value: sk-... (실제 API 키)
Sensitive: ✅ Enabled (체크!)
Environments: All Environments
```

### 데이터베이스 URL
```
Key: DATABASE_URL
Value: postgresql://... (실제 DB URL)
Sensitive: ✅ Enabled
Environments: All Environments
```

### Redis URL
```
Key: REDIS_URL
Value: redis://... (실제 Redis URL)
Sensitive: ✅ Enabled
Environments: All Environments
```

---

## 🚨 문제 해결

### 문제 1: 환경변수가 적용되지 않음
**해결**: Redeploy 실행 확인

### 문제 2: URL을 찾을 수 없음
**해결**: Deployments 탭에서 Domains 확인

### 문제 3: Save 버튼이 비활성화됨
**해결**: Key와 Value 필드가 모두 입력되었는지 확인

---

## ✅ 최종 체크리스트

- [ ] Vercel 대시보드 접속 완료
- [ ] 프로젝트 선택 완료
- [ ] Settings → Environment Variables 이동 완료
- [ ] 실제 배포 URL 확인 완료
- [ ] Key: `NEXT_PUBLIC_ARBITRAGE_API_URL` 입력 완료
- [ ] Value: 실제 배포 URL 입력 완료
- [ ] Environments: All Environments 선택 완료
- [ ] Save 버튼 클릭 완료
- [ ] 환경변수 목록에 추가 확인 완료
- [ ] Redeploy 실행 완료
- [ ] 배포 완료 확인 (Ready 상태)
- [ ] 사이트 접속 테스트 완료

---

**보스, 이 가이드대로 따라하시면 완벽하게 설정됩니다!** ✅

각 단계를 천천히 따라하시면 됩니다! 🚀

---

**인프라 연결까지 완벽하게 준비되었습니다!** ✅
