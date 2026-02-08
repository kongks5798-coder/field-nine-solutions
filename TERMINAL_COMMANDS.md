# 💻 터미널에 입력할 명령어 (초등학생도 따라하는 가이드)

**현재 상황:** VS Code 터미널에서 Git 명령어를 실행해야 합니다.

---

## 📋 전체 순서 (한 번에 복사-붙여넣기)

**VS Code 하단 터미널에서 다음 명령어들을 순서대로 실행하세요:**

```powershell
# 1. 프로젝트 폴더로 이동 (이미 있다면 생략 가능)
cd c:\Users\polor\field-nine-solutions

# 2. Git 초기화 (처음 한 번만)
git init

# 3. 모든 파일 추가
git add .

# 4. 커밋 (저장)
git commit -m "Initial commit: Field Nine Solutions with PWA"

# 5. GitHub 리포지토리 연결 (사용자명을 본인 것으로 변경!)
git remote add origin https://github.com/사용자명/field-nine-solutions.git

# 6. 메인 브랜치로 설정
git branch -M main

# 7. GitHub에 올리기
git push -u origin main
```

---

## 🎯 단계별 설명

### 1단계: 프로젝트 폴더로 이동

**터미널에 입력:**
```powershell
cd c:\Users\polor\field-nine-solutions
```

**Enter 키 누르기**

**이미 그 폴더에 있다면:**
- 이 단계는 건너뛰어도 됩니다

---

### 2단계: Git 초기화

**터미널에 입력:**
```powershell
git init
```

**Enter 키 누르기**

**결과:**
- "Initialized empty Git repository" 또는 "Reinitialized existing Git repository" 메시지가 나타납니다
- 정상입니다!

---

### 3단계: 모든 파일 추가

**터미널에 입력:**
```powershell
git add .
```

**Enter 키 누르기**

**주의:** 명령어 끝에 점(.)이 있습니다!

**결과:**
- 아무 메시지도 안 나올 수 있습니다
- 정상입니다!

---

### 4단계: 커밋 (저장)

**터미널에 입력:**
```powershell
git commit -m "Initial commit: Field Nine Solutions with PWA"
```

**Enter 키 누르기**

**결과:**
- "X files changed" 같은 메시지가 나타납니다
- 정상입니다!

---

### 5단계: GitHub 리포지토리 연결

**⚠️ 중요: `사용자명`을 본인의 GitHub 사용자명으로 바꾸세요!**

**터미널에 입력:**
```powershell
git remote add origin https://github.com/사용자명/field-nine-solutions.git
```

**예시:**
- 사용자명이 `kongks5798`라면:
  ```powershell
  git remote add origin https://github.com/kongks5798/field-nine-solutions.git
  ```

**Enter 키 누르기**

**결과:**
- 아무 메시지도 안 나올 수 있습니다
- 정상입니다!

---

### 6단계: 메인 브랜치로 설정

**터미널에 입력:**
```powershell
git branch -M main
```

**Enter 키 누르기**

**결과:**
- 아무 메시지도 안 나올 수 있습니다
- 정상입니다!

---

### 7단계: GitHub에 올리기 (푸시)

**터미널에 입력:**
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

## 🚨 문제 해결

### "fatal: not a git repository" 에러가 나면:

```powershell
git init
```

그 다음 3단계부터 다시 진행하세요.

---

### "remote origin already exists" 에러가 나면:

```powershell
git remote remove origin
git remote add origin https://github.com/사용자명/field-nine-solutions.git
```

그 다음 6단계부터 다시 진행하세요.

---

### "Permission denied" 에러가 나면:

GitHub에 로그인되어 있는지 확인하세요.

---

### "repository not found" 에러가 나면:

1. GitHub에서 `field-nine-solutions` 리포지토리를 만들었는지 확인
2. 리포지토리 이름이 정확한지 확인
3. 사용자명이 정확한지 확인

---

## ✅ 완료 확인

**모든 명령어를 실행한 후:**

1. **GitHub 웹사이트 접속:**
   ```
   https://github.com/사용자명/field-nine-solutions
   ```

2. **파일들이 보이면 성공!**
   - `app`, `src`, `public` 등의 폴더가 보여야 합니다

---

## 📋 체크리스트

진행 상황을 체크하세요:

- [ ] `cd c:\Users\polor\field-nine-solutions` 실행
- [ ] `git init` 실행
- [ ] `git add .` 실행
- [ ] `git commit -m "..."` 실행
- [ ] `git remote add origin ...` 실행 (사용자명 정확히 입력)
- [ ] `git branch -M main` 실행
- [ ] `git push -u origin main` 실행
- [ ] GitHub에서 파일 확인

---

## 🎯 요약

**터미널에 입력할 명령어 (순서대로):**

1. `cd c:\Users\polor\field-nine-solutions`
2. `git init`
3. `git add .`
4. `git commit -m "Initial commit: Field Nine Solutions with PWA"`
5. `git remote add origin https://github.com/사용자명/field-nine-solutions.git` (사용자명 변경!)
6. `git branch -M main`
7. `git push -u origin main`

**각 명령어를 입력한 후 Enter 키를 누르세요!**

---

**지금 바로 1단계부터 시작하세요!** 🚀
