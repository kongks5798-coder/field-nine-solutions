# ⚡ 빠른 터미널 명령어 (복사-붙여넣기)

**VS Code 하단 터미널에 이 명령어들을 순서대로 입력하세요!**

---

## 📋 전체 명령어 (한 번에 복사 가능)

```powershell
# 1. 프로젝트 폴더로 이동
cd c:\Users\polor\field-nine-solutions

# 2. GitHub 리포지토리 연결 (사용자명을 본인 것으로 변경!)
git remote add origin https://github.com/사용자명/field-nine-solutions.git

# 3. GitHub에 올리기
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

---

### 2단계: GitHub 리포지토리 연결

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

**"remote origin already exists" 에러가 나면:**
```powershell
git remote remove origin
git remote add origin https://github.com/사용자명/field-nine-solutions.git
```

---

### 3단계: GitHub에 올리기

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

## ✅ 완료 확인

**모든 명령어를 실행한 후:**

1. **GitHub 웹사이트 접속:**
   ```
   https://github.com/사용자명/field-nine-solutions
   ```

2. **파일들이 보이면 성공!**
   - `app`, `src`, `public` 등의 폴더가 보여야 합니다

3. **Vercel로 돌아가기:**
   - Vercel 대시보드 > Settings > Git
   - "GitHub" 버튼 클릭
   - `field-nine-solutions` 리포지토리 찾기
   - "Connect" 버튼 클릭

---

## 🚨 문제 해결

### "remote origin already exists" 에러:

```powershell
git remote remove origin
git remote add origin https://github.com/사용자명/field-nine-solutions.git
```

### "repository not found" 에러:

1. GitHub에서 `field-nine-solutions` 리포지토리를 만들었는지 확인
2. 리포지토리 이름이 정확한지 확인
3. 사용자명이 정확한지 확인

### "Permission denied" 에러:

GitHub에 로그인되어 있는지 확인하세요.

---

## 📋 체크리스트

- [ ] `cd c:\Users\polor\field-nine-solutions` 실행
- [ ] `git remote add origin ...` 실행 (사용자명 정확히 입력)
- [ ] `git push -u origin main` 실행
- [ ] GitHub에서 파일 확인
- [ ] Vercel에서 리포지토리 연결

---

**지금 바로 1단계부터 시작하세요!** 🚀
