# 🔍 NEXT_PUBLIC_ARBITRAGE_API_URL이 안 보일 때 해결 가이드

## 📋 상황 확인

현재 상태:
- ❌ `NEXT_PUBLIC_ARBITRAGE_API_URL`이 환경변수 목록에 없음
- ✅ Vercel Environment Variables 페이지는 열려있음

---

## 🎯 해결 방법: 새로 추가하기

### Step 1: "Add New" 섹션 찾기 (5초)

1. **화면 확인**
   - Environment Variables 페이지에서
   - 상단에 **"Add New"** 또는 **"Create new"** 섹션이 보임

2. **"Add New" 탭 확인**
   - 상단에 탭이 있다면 **"Create new"** 탭이 선택되어 있는지 확인
   - 선택되어 있지 않으면 클릭

**✅ Step 1 완료 확인:**
- [ ] "Add New" 또는 "Create new" 섹션이 보임
- [ ] 해당 탭이 선택되어 있음

---

### Step 2: Key 필드에 입력 (10초)

1. **"Key" 필드 찾기**
   - "Add New" 섹션에서
   - "Key" 라벨 아래 입력 필드 찾기

2. **Key 필드 클릭**
   - "Key" 입력 필드 클릭

3. **정확히 입력**
   ```
   NEXT_PUBLIC_ARBITRAGE_API_URL
   ```
   - ⚠️ **대소문자 정확히 입력**
   - ⚠️ **공백 없이 입력**
   - ⚠️ **언더스코어(_) 사용**

4. **입력 확인**
   - 입력 필드에 `NEXT_PUBLIC_ARBITRAGE_API_URL`이 보이면 성공

**✅ Step 2 완료 확인:**
- [ ] Key 필드에 `NEXT_PUBLIC_ARBITRAGE_API_URL` 입력 완료
- [ ] 대소문자 정확히 입력 확인

---

### Step 3: 실제 배포 URL 확인 (30초)

⚠️ **중요**: Value에 실제 배포 URL을 입력해야 합니다!

#### 방법 A: Deployments 탭에서 확인
1. **새 탭에서 확인 (현재 페이지 유지)**
   - 브라우저에서 새 탭 열기 (Ctrl+T)
   - 또는 현재 탭에서 상단 네비게이션의 **"Deployments"** 클릭

2. **최신 배포 찾기**
   - 목록 맨 위에 최신 배포가 있음

3. **URL 확인**
   - 배포 항목에 "Domains" 섹션이 있음
   - 예: `field-nine-solutions.vercel.app`
   - 또는 `field-nine-solutions-[hash].vercel.app`

4. **URL 복사**
   - URL을 복사 (Ctrl+C)
   - 또는 메모장에 메모

5. **Environment Variables 페이지로 돌아가기**
   - Settings → Environment Variables로 다시 이동

#### 방법 B: Overview 탭에서 확인
1. 상단 네비게이션에서 **"Overview"** 클릭
2. 상단에 배포 URL이 표시됨
3. URL 복사
4. Settings → Environment Variables로 다시 이동

**✅ Step 3 완료 확인:**
- [ ] 실제 배포 URL을 확인함
- [ ] URL을 복사하거나 메모함
- [ ] 예: `https://field-nine-solutions.vercel.app`
- [ ] Environment Variables 페이지로 돌아옴

---

### Step 4: Value 필드에 입력 (10초)

1. **"Value" 필드 찾기**
   - "Key" 필드 아래에 "Value" 필드가 있음

2. **Value 필드 클릭**
   - "Value" 입력 필드 클릭

3. **실제 배포 URL 입력**
   ```
   https://field-nine-solutions.vercel.app
   ```
   - ⚠️ **Step 3에서 확인한 실제 URL로 변경!**
   - ⚠️ **`https://` 포함하여 입력**
   - ⚠️ **마지막에 `/` 없이 입력**

4. **입력 확인**
   - Value 필드에 실제 URL이 보이면 성공

**✅ Step 4 완료 확인:**
- [ ] Value 필드에 실제 배포 URL 입력 완료
- [ ] `https://` 포함하여 입력 완료

---

### Step 5: Environments 선택 (5초)

1. **"Environments" 드롭다운 찾기**
   - Key/Value 필드 아래에 "Environments" 드롭다운이 있음

2. **드롭다운 클릭**
   - "Environments" 드롭다운 클릭

3. **"All Environments" 선택**
   - 드롭다운 메뉴에서 **"All Environments"** 선택
   - ⚠️ **권장**: 모든 환경에 적용

**✅ Step 5 완료 확인:**
- [ ] Environments 드롭다운 클릭 완료
- [ ] "All Environments" 선택 완료

---

### Step 6: Sensitive 설정 확인 (5초)

1. **"Sensitive" 섹션 확인**
   - Key/Value 필드 위 또는 옆에 "Sensitive" 섹션이 있음

2. **"Disabled" 선택 확인**
   - 기본값이 "Disabled"로 선택되어 있음
   - API URL은 공개 정보이므로 "Disabled"로 유지

**✅ Step 6 완료 확인:**
- [ ] Sensitive: Disabled 선택 확인

---

### Step 7: Save 버튼 클릭 (5초)

1. **화면 하단 확인**
   - 오른쪽에 검은색 **"Save"** 버튼이 보임

2. **Save 버튼 클릭**
   - **"Save"** 버튼 클릭

3. **저장 확인**
   - 잠시 후 환경변수가 목록에 추가됨
   - ✅ 표시 또는 "Saved" 메시지 확인
   - 목록에서 `NEXT_PUBLIC_ARBITRAGE_API_URL`이 보임

**✅ Step 7 완료 확인:**
- [ ] Save 버튼 클릭 완료
- [ ] 저장 완료 메시지 확인
- [ ] 목록에 `NEXT_PUBLIC_ARBITRAGE_API_URL` 추가 확인

---

### Step 8: 목록에서 확인 (5초)

1. **목록 스크롤**
   - "Add New" 섹션 아래에 환경변수 목록이 있음
   - 목록을 스크롤하여 확인

2. **`NEXT_PUBLIC_ARBITRAGE_API_URL` 찾기**
   - 목록에서 `NEXT_PUBLIC_ARBITRAGE_API_URL` 찾기
   - Value는 마스킹되어 보임 (점으로 표시)

3. **확인 완료**
   - 목록에 추가된 것을 확인하면 성공

**✅ Step 8 완료 확인:**
- [ ] 목록에서 `NEXT_PUBLIC_ARBITRAGE_API_URL` 찾음
- [ ] Value가 마스킹되어 보임

---

### Step 9: Redeploy 실행 (30초)

⚠️ **중요**: 환경변수 변경 후 반드시 Redeploy 필요!

1. **상단 네비게이션 확인**
   - 상단 네비게이션 바에서 **"Deployments"** 클릭

2. **최신 배포 찾기**
   - 목록 맨 위에 최신 배포가 있음

3. **... 메뉴 클릭**
   - 최신 배포 항목 오른쪽에 **...** (점 3개) 메뉴 클릭

4. **Redeploy 선택**
   - 드롭다운 메뉴에서 **"Redeploy"** 선택

5. **확인**
   - 확인 대화상자에서 **"Redeploy"** 클릭

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

## 🔍 문제 해결

### 문제 1: "Add New" 섹션이 안 보임

**원인**: 다른 탭이 선택되어 있음

**해결**:
1. 상단 탭 확인
2. **"Create new"** 또는 **"Add New"** 탭 클릭

---

### 문제 2: Key 필드가 비활성화됨

**원인**: 페이지가 완전히 로드되지 않음

**해결**:
1. 페이지 새로고침 (F5)
2. 잠시 대기 후 다시 시도

---

### 문제 3: Save 버튼이 비활성화됨

**원인**: Key 또는 Value 필드가 비어있음

**해결**:
1. Key 필드에 `NEXT_PUBLIC_ARBITRAGE_API_URL` 입력 확인
2. Value 필드에 실제 URL 입력 확인
3. 두 필드 모두 입력되면 Save 버튼 활성화됨

---

### 문제 4: 저장 후 목록에 안 보임

**원인**: 목록이 업데이트되지 않음

**해결**:
1. 페이지 새로고침 (F5)
2. 목록을 스크롤하여 확인
3. 검색 기능 사용 (있는 경우)

---

### 문제 5: 배포 URL을 찾을 수 없음

**해결**:
1. Deployments 탭에서 최신 배포 확인
2. Domains 섹션에서 URL 확인
3. 또는 Overview 탭에서 URL 확인

---

## 📋 최종 체크리스트

- [ ] "Add New" 섹션 찾기 완료
- [ ] Key: `NEXT_PUBLIC_ARBITRAGE_API_URL` 입력 완료
- [ ] 실제 배포 URL 확인 완료
- [ ] Value: 실제 배포 URL 입력 완료
- [ ] Environments: All Environments 선택 완료
- [ ] Sensitive: Disabled 선택 확인
- [ ] Save 버튼 클릭 완료
- [ ] 목록에 `NEXT_PUBLIC_ARBITRAGE_API_URL` 추가 확인
- [ ] Redeploy 실행 완료
- [ ] 배포 완료 확인 (Ready 상태)

---

## 🎯 빠른 참조

### 입력해야 할 값

```
Key: NEXT_PUBLIC_ARBITRAGE_API_URL
Value: https://field-nine-solutions.vercel.app
Environments: All Environments
Sensitive: Disabled
```

⚠️ **Value는 실제 배포 URL로 변경!**

---

## 📸 화면 구성 참고

```
┌─────────────────────────────────────────┐
│ Environment Variables                    │
├─────────────────────────────────────────┤
│                                         │
│  [Create new] [Link Shared]            │ ← 탭 확인
│                                         │
│  Key:                                   │
│  [NEXT_PUBLIC_ARBITRAGE_API_URL    ]   │ ← Step 2
│                                         │
│  Value:                                 │
│  [https://your-app.vercel.app       ]   │ ← Step 4
│                                         │
│  Environments:                          │
│  [All Environments ▼]                   │ ← Step 5
│                                         │
│  ☑ Automatically expose System...      │
│                                         │
│                              [Save]     │ ← Step 7
└─────────────────────────────────────────┘
│                                         │
│  기존 환경변수 목록:                    │
│  - ENCRYPTION_KEY                       │
│  - NEXT_PUBLIC_PYTHON_SERVER_URL        │
│  - NEXT_PUBLIC_ARBITRAGE_API_URL  ← 여기에 추가됨!
│  ...                                    │
└─────────────────────────────────────────┘
```

---

**보스, 이 가이드대로 Step 1부터 Step 9까지 순서대로 따라하시면 `NEXT_PUBLIC_ARBITRAGE_API_URL`이 목록에 추가됩니다!** ✅

천천히 하나씩 따라하시면 됩니다! 🚀

---

**인프라 연결까지 완벽하게 준비되었습니다!** ✅
