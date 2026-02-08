# 🎯 초등학생도 따라하는 GitHub 리포지토리 만들기

**현재 상황:** Vercel에 연결할 GitHub 리포지토리가 없습니다. 새로 만들어야 합니다!

---

## 📋 전체 순서 (총 3단계)

1. **GitHub에서 리포지토리 만들기** (5분)
2. **로컬 코드를 GitHub에 올리기** (3분)
3. **Vercel과 연결하기** (2분)

**총 소요 시간: 약 10분** ⏱️

---

## 1단계: GitHub에서 리포지토리 만들기 (5분)

### 1-1. GitHub 웹사이트 열기

1. **브라우저 열기** (Chrome, Edge 등)
2. **주소창에 입력:**
   ```
   https://github.com
   ```
3. **Enter 키 누르기**

---

### 1-2. 로그인하기

1. **오른쪽 위에 "Sign in" 버튼 클릭**
2. **GitHub 계정으로 로그인**
   - 이미 로그인되어 있다면 이 단계 건너뛰기

---

### 1-3. 새 리포지토리 만들기

1. **오른쪽 위에 있는 "+" 버튼 클릭**
   - 화면 오른쪽 위 모서리에 있음
   - 마우스를 올리면 "New"라고 표시됨

2. **"New repository" 클릭**
   - 드롭다운 메뉴에서 선택

---

### 1-4. 리포지토리 정보 입력하기

**다음 정보를 입력하세요:**

1. **Repository name (리포지토리 이름):**
   ```
   field-nine-solutions
   ```
   - 정확히 이렇게 입력하세요!

2. **Description (설명):**
   ```
   Field Nine - Commercial SaaS Solution
   ```
   - 선택사항이지만 입력하는 것이 좋습니다

3. **Public / Private 선택:**
   - **Private** 선택 (비공개)
   - 또는 **Public** 선택 (공개)
   - 둘 다 괜찮습니다!

4. **아래 체크박스들은 모두 체크 해제:**
   - ❌ "Add a README file" (체크 해제)
   - ❌ "Add .gitignore" (체크 해제)
   - ❌ "Choose a license" (체크 해제)
   
   **왜?** 이미 코드가 있으니까요!

5. **"Create repository" 버튼 클릭**
   - 초록색 버튼입니다

---

### 1-5. 리포지토리 주소 복사하기

리포지토리를 만들면 다음 페이지가 나타납니다.

**중요한 정보:**
- **"Quick setup"** 섹션에 주소가 있습니다
- 다음과 같은 주소가 보입니다:
  ```
  https://github.com/사용자명/field-nine-solutions.git
  ```
- **이 주소를 복사하세요!** (나중에 사용합니다)

---

## 2단계: 로컬 코드를 GitHub에 올리기 (3분)

### 2-1. 터미널 열기

1. **VS Code 열기** (이미 열려있을 수 있음)
2. **하단에 "Terminal" 탭 클릭**
   - 또는 `Ctrl + `` (백틱) 키 누르기

---

### 2-2. 프로젝트 폴더로 이동하기

터미널에 다음 명령어 입력:

```powershell
cd c:\Users\polor\field-nine-solutions
```

**Enter 키 누르기**

---

### 2-3. Git 초기화 (처음 한 번만)

터미널에 다음 명령어 입력:

```powershell
git init
```

**Enter 키 누르기**

**이미 Git이 초기화되어 있다면:**
- "Reinitialized existing Git repository" 메시지가 나옵니다
- 괜찮습니다! 계속 진행하세요

---

### 2-4. 모든 파일 추가하기

터미널에 다음 명령어 입력:

```powershell
git add .
```

**Enter 키 누르기**

**주의:** 명령어 끝에 점(.)이 있습니다!

---

### 2-5. 커밋하기 (저장하기)

터미널에 다음 명령어 입력:

```powershell
git commit -m "Initial commit: Field Nine Solutions with PWA"
```

**Enter 키 누르기**

---

### 2-6. GitHub 리포지토리 연결하기

터미널에 다음 명령어 입력:

```powershell
git remote add origin https://github.com/사용자명/field-nine-solutions.git
```

**중요:** `사용자명`을 본인의 GitHub 사용자명으로 바꾸세요!

**예시:**
- 사용자명이 `kongks5798`라면:
  ```
  git remote add origin https://github.com/kongks5798/field-nine-solutions.git
  ```

**Enter 키 누르기**

---

### 2-7. 메인 브랜치로 설정하기

터미널에 다음 명령어 입력:

```powershell
git branch -M main
```

**Enter 키 누르기**

---

### 2-8. GitHub에 올리기 (푸시하기)

터미널에 다음 명령어 입력:

```powershell
git push -u origin main
```

**Enter 키 누르기**

**처음이라면:**
- GitHub 로그인 창이 나타날 수 있습니다
- 로그인하면 계속 진행됩니다

**성공하면:**
- "Enumerating objects..." 메시지가 나타납니다
- 몇 초 후 "To https://github.com/..." 메시지가 나타나면 성공!

---

## 3단계: Vercel과 연결하기 (2분)

### 3-1. Vercel 대시보드로 돌아가기

1. **Vercel 대시보드 페이지로 돌아가기**
   - 이미 열려있다면 그대로 사용
   - 아니면: https://vercel.com/dashboard 접속

2. **프로젝트 선택:**
   - `field-nine-solutions` 프로젝트 클릭

3. **Settings 탭 클릭**

4. **왼쪽 메뉴에서 "Git" 클릭**
   - 이미 Git 설정 페이지에 있다면 이 단계 건너뛰기

---

### 3-2. 리포지토리 찾기

1. **"Search..." 검색창에 입력:**
   ```
   field-nine-solutions
   ```

2. **리스트에서 찾기:**
   - 방금 만든 `field-nine-solutions` 리포지토리가 나타납니다
   - 옆에 "Connect" 버튼이 있습니다

3. **"Connect" 버튼 클릭**

---

### 3-3. 설정 확인

**자동으로 설정됩니다:**
- ✅ Production Branch: `main`
- ✅ Automatic Deployments: 활성화
- ✅ Preview Deployments: 활성화

**설정이 완료되면:**
- "Connected Git Repository" 섹션에 리포지토리가 표시됩니다
- 이제 `git push`만 하면 자동 배포됩니다!

---

## ✅ 완료 확인

### 확인 방법 1: GitHub에서 확인

1. **GitHub 웹사이트 접속:**
   ```
   https://github.com/사용자명/field-nine-solutions
   ```

2. **파일들이 보이면 성공!**
   - `app`, `src`, `public` 등의 폴더가 보여야 합니다

### 확인 방법 2: Vercel에서 확인

1. **Vercel 대시보드 > Deployments 탭**
2. **새로운 배포가 자동으로 시작됩니다**
3. **2-3분 후 "Ready" 상태가 되면 완료!**

---

## 🎯 이제 사용하는 방법

**코드를 수정하고 배포하는 방법:**

```powershell
# 1. 코드 수정 (에디터에서)

# 2. 변경사항 추가
git add .

# 3. 커밋 (저장)
git commit -m "새 기능 추가"

# 4. GitHub에 올리기
git push origin main

# 끝! 자동으로 배포됩니다! 🚀
```

**약 2-3분 후 fieldnine.io가 자동으로 업데이트됩니다!**

---

## 🚨 문제 해결

### "remote origin already exists" 에러가 나면:

```powershell
git remote remove origin
git remote add origin https://github.com/사용자명/field-nine-solutions.git
```

### "fatal: not a git repository" 에러가 나면:

```powershell
git init
```

그 다음 2-4단계부터 다시 진행하세요.

### "Permission denied" 에러가 나면:

GitHub에 로그인되어 있는지 확인하세요.

---

## 📋 체크리스트

진행 상황을 체크하세요:

- [ ] GitHub 리포지토리 생성 완료
- [ ] 리포지토리 주소 복사 완료
- [ ] 터미널에서 `git init` 실행
- [ ] `git add .` 실행
- [ ] `git commit` 실행
- [ ] `git remote add origin` 실행 (주소 정확히 입력)
- [ ] `git push -u origin main` 실행
- [ ] GitHub에서 파일 확인
- [ ] Vercel에서 리포지토리 연결
- [ ] 자동 배포 확인

---

## 🎉 완료!

**이제 Tesla처럼 자동 업데이트가 가능합니다!**

- 코드 수정 → `git push` → 자동 배포 → fieldnine.io 업데이트

**총 소요 시간: 약 10분** ⏱️

---

**궁금한 점이 있으면 언제든 물어보세요!** 😊
