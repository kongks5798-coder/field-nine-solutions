# 🎯 Vercel 환경변수 추가 - 지금 바로 따라하기

## 📸 현재 화면 상태

지금 보이는 화면:
- ✅ Vercel 대시보드 접속 완료
- ✅ 프로젝트 선택 완료
- ✅ Settings → Environment Variables 이동 완료
- ✅ "Add New" 섹션이 보임

---

## 🚀 다음 단계: 환경변수 추가하기

### Step 1: Key 필드에 입력 (10초)

1. **"Key" 필드 클릭**
   - 화면 중앙의 "Add New" 섹션에서
   - "Key" 라벨 아래 입력 필드 클릭

2. **정확히 입력**
   ```
   NEXT_PUBLIC_ARBITRAGE_API_URL
   ```
   - ⚠️ **대소문자 정확히 입력**
   - ⚠️ **공백 없이 입력**
   - ⚠️ **언더스코어(_) 사용**

3. **입력 확인**
   - 입력 필드에 `NEXT_PUBLIC_ARBITRAGE_API_URL`이 보이면 성공

**✅ Step 1 완료 확인:**
- [ ] Key 필드에 `NEXT_PUBLIC_ARBITRAGE_API_URL` 입력 완료

---

### Step 2: 실제 배포 URL 확인 (30초)

⚠️ **중요**: Value에 실제 배포 URL을 입력해야 합니다!

#### 방법 A: 현재 화면에서 확인
1. **상단 네비게이션 바 확인**
   - "Deployments" 탭 클릭

2. **최신 배포 찾기**
   - 목록 맨 위에 최신 배포가 있음

3. **URL 확인**
   - 배포 항목에 "Domains" 섹션이 있음
   - 예: `field-nine-solutions.vercel.app`
   - 또는 `field-nine-solutions-[hash].vercel.app`

4. **URL 복사**
   - URL을 복사하거나 메모

#### 방법 B: Overview 탭에서 확인
1. 상단 네비게이션에서 **Overview** 클릭
2. 상단에 배포 URL이 표시됨
3. URL 복사

**✅ Step 2 완료 확인:**
- [ ] 실제 배포 URL을 확인함
- [ ] URL을 복사하거나 메모함
- [ ] 예: `https://field-nine-solutions.vercel.app`

---

### Step 3: Value 필드에 입력 (10초)

1. **"Value" 필드 클릭**
   - "Key" 필드 아래의 "Value" 필드 클릭

2. **실제 배포 URL 입력**
   ```
   https://field-nine-solutions.vercel.app
   ```
   - ⚠️ **Step 2에서 확인한 실제 URL로 변경!**
   - ⚠️ **`https://` 포함하여 입력**
   - ⚠️ **마지막에 `/` 없이 입력**

3. **입력 확인**
   - Value 필드에 실제 URL이 보이면 성공

**✅ Step 3 완료 확인:**
- [ ] Value 필드에 실제 배포 URL 입력 완료
- [ ] `https://` 포함하여 입력 완료

---

### Step 4: Environments 선택 (5초)

1. **"Environments" 드롭다운 찾기**
   - Key/Value 필드 아래에 "Environments" 드롭다운이 있음

2. **드롭다운 클릭**
   - "Environments" 드롭다운 클릭

3. **"All Environments" 선택**
   - 드롭다운 메뉴에서 **"All Environments"** 선택
   - ⚠️ **권장**: 모든 환경에 적용

**✅ Step 4 완료 확인:**
- [ ] Environments 드롭다운 클릭 완료
- [ ] "All Environments" 선택 완료

---

### Step 5: Sensitive 설정 확인 (5초)

1. **"Sensitive" 섹션 확인**
   - Key/Value 필드 위 또는 옆에 "Sensitive" 섹션이 있음

2. **"Disabled" 선택 확인**
   - 기본값이 "Disabled"로 선택되어 있음
   - API URL은 공개 정보이므로 "Disabled"로 유지

**✅ Step 5 완료 확인:**
- [ ] Sensitive: Disabled 선택 확인

---

### Step 6: Note 입력 (선택사항, 10초)

1. **"Note" 필드 클릭**
   - Value 필드 아래에 "Note" 텍스트 영역이 있음

2. **설명 입력 (선택사항)**
   ```
   차익거래 엔진 API URL 설정
   프론트엔드에서 API 호출 시 사용
   ```

3. **입력 확인**
   - Note 필드에 설명이 보이면 성공
   - ⚠️ **선택사항**: 입력하지 않아도 됨

**✅ Step 6 완료 확인:**
- [ ] Note 입력 완료 (선택사항)

---

### Step 7: Save 버튼 클릭 (5초)

1. **화면 하단 확인**
   - 오른쪽에 검은색 **Save** 버튼이 보임

2. **Save 버튼 클릭**
   - **Save** 버튼 클릭

3. **저장 확인**
   - 잠시 후 환경변수가 목록에 추가됨
   - ✅ 표시 또는 "Saved" 메시지 확인

**✅ Step 7 완료 확인:**
- [ ] Save 버튼 클릭 완료
- [ ] 환경변수가 목록에 추가됨
- [ ] 저장 완료 메시지 확인

---

### Step 8: 환경변수 목록 확인 (5초)

1. **목록 확인**
   - "Add New" 섹션 아래에 환경변수 목록이 있음

2. **추가된 환경변수 확인**
   - `NEXT_PUBLIC_ARBITRAGE_API_URL`이 목록에 보임
   - Value는 마스킹되어 보임 (점으로 표시)

3. **확인 완료**
   - 목록에 추가된 것을 확인하면 성공

**✅ Step 8 완료 확인:**
- [ ] 환경변수 목록에 `NEXT_PUBLIC_ARBITRAGE_API_URL` 추가 확인
- [ ] Value가 마스킹되어 보임

---

### Step 9: Redeploy 실행 (30초)

⚠️ **중요**: 환경변수 변경 후 반드시 Redeploy 필요!

1. **상단 네비게이션 바 확인**
   - "Deployments" 탭 클릭

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

**✅ Step 9 완료 확인:**
- [ ] Deployments 탭으로 이동 완료
- [ ] 최신 배포의 ... 메뉴 클릭 완료
- [ ] Redeploy 선택 완료
- [ ] 확인 대화상자에서 Redeploy 클릭 완료
- [ ] 배포 상태가 "Building"으로 변경됨

---

## 🎉 완료!

### 최종 확인

1. **배포 완료 확인**
   - Deployments 탭에서 상태가 "Ready"가 되면 완료
   - 약 2-3분 대기

2. **사이트 접속 테스트**
   ```
   https://your-app.vercel.app/arbitrage
   ```
   - 차익거래 페이지가 정상적으로 로드되는지 확인

3. **API 연결 확인**
   - 브라우저 개발자 도구 (F12) → Console 탭
   - API 호출 오류가 없는지 확인

---

## 📋 최종 체크리스트

- [ ] Key: `NEXT_PUBLIC_ARBITRAGE_API_URL` 입력 완료
- [ ] Value: 실제 배포 URL 입력 완료
- [ ] Environments: All Environments 선택 완료
- [ ] Sensitive: Disabled 선택 확인
- [ ] Save 버튼 클릭 완료
- [ ] 환경변수 목록에 추가 확인 완료
- [ ] Deployments 탭으로 이동 완료
- [ ] Redeploy 실행 완료
- [ ] 배포 완료 확인 (Ready 상태)
- [ ] 사이트 접속 테스트 완료

---

## 🚨 문제 해결

### 문제 1: Save 버튼이 비활성화됨
**원인**: Key 또는 Value 필드가 비어있음
**해결**: Key와 Value 필드를 모두 입력

### 문제 2: URL을 찾을 수 없음
**해결**: 
1. Deployments 탭에서 최신 배포 확인
2. Domains 섹션에서 URL 확인

### 문제 3: 환경변수가 적용되지 않음
**원인**: Redeploy를 실행하지 않음
**해결**: Step 9의 Redeploy 실행

---

## 📸 화면 구성 참고

```
┌─────────────────────────────────────────┐
│ Environment Variables                    │
├─────────────────────────────────────────┤
│                                         │
│  [Create new] [Link Shared]            │
│                                         │
│  Key:                                   │
│  [NEXT_PUBLIC_ARBITRAGE_API_URL    ]   │ ← Step 1
│                                         │
│  Value:                                 │
│  [https://your-app.vercel.app       ]   │ ← Step 3
│                                         │
│  Environments:                          │
│  [All Environments ▼]                    │ ← Step 4
│                                         │
│  Note:                                  │
│  [차익거래 엔진 API URL 설정        ]   │ ← Step 6
│                                         │
│  [Add Another] [Import .env]            │
│                                         │
│  ☑ Automatically expose System...      │
│                                         │
│                              [Save]     │ ← Step 7
└─────────────────────────────────────────┘
```

---

**보스, 이제 Step 1부터 Step 9까지 순서대로 따라하시면 완벽하게 설정됩니다!** ✅

천천히 하나씩 따라하시면 됩니다! 🚀

---

**인프라 연결까지 완벽하게 준비되었습니다!** ✅
