# 🎯 Vercel에서 GitHub 연결하기 (초등학생도 따라하는 가이드)

**현재 화면:** Vercel 프로젝트 설정 > Git 페이지

---

## 📋 현재 화면 설명

**보이는 내용:**
- "Seamlessly create Deployments for any commits pushed to your Git repository." (설명)
- 세 개의 큰 버튼: **GitHub**, **GitLab**, **Bitbucket**
- "This Project is not connected to a Git repository." (아직 연결 안 됨)

---

## ✅ 지금 바로 할 일 (3단계)

### 1단계: GitHub 버튼 클릭

1. **화면 중앙에 있는 큰 버튼 찾기**
   - 세 개의 버튼이 있습니다
   - 왼쪽부터: **GitHub**, **GitLab**, **Bitbucket**

2. **"GitHub" 버튼 클릭**
   - 가장 왼쪽에 있는 버튼입니다
   - 깃허브 고양이 아이콘이 그려져 있습니다

---

### 2단계: GitHub 로그인 및 권한 허용

**버튼을 클릭하면:**

1. **새 창이 열립니다** (또는 같은 창에서 이동)
   - GitHub 로그인 페이지가 나타납니다

2. **GitHub 로그인**
   - 이미 로그인되어 있다면 이 단계 건너뛰기
   - 로그인이 필요하면 로그인하세요

3. **권한 허용**
   - "Vercel이 다음에 접근할 수 있도록 허용하시겠습니까?" 같은 메시지가 나타납니다
   - **"Authorize"** 또는 **"허용"** 버튼 클릭

---

### 3단계: 리포지토리 선택

**권한을 허용하면:**

1. **리포지토리 목록이 나타납니다**
   - GitHub에 있는 모든 리포지토리가 보입니다

2. **리포지토리 찾기**
   - `field-nine-solutions` 리포지토리를 찾으세요
   - 아직 만들지 않았다면 먼저 만들어야 합니다 (아래 참고)

3. **리포지토리 선택**
   - `field-nine-solutions` 옆에 있는 **"Connect"** 또는 **"연결"** 버튼 클릭

4. **완료!**
   - 자동으로 연결되고 배포가 시작됩니다!

---

## ⚠️ 리포지토리가 없다면?

**`field-nine-solutions` 리포지토리가 보이지 않는다면:**

### 먼저 GitHub에서 리포지토리 만들기

1. **새 탭 열기** (현재 탭은 그대로 두기)
   - `Ctrl + T` 키 누르기

2. **GitHub 웹사이트 접속:**
   ```
   https://github.com
   ```

3. **오른쪽 위 "+" 버튼 클릭**
4. **"New repository" 클릭**
5. **Repository name 입력:**
   ```
   field-nine-solutions
   ```
6. **Public 또는 Private 선택**
7. **아래 체크박스 모두 해제**
   - "Add a README file" 해제
   - "Add .gitignore" 해제
   - "Choose a license" 해제
8. **"Create repository" 버튼 클릭**

9. **리포지토리 주소 복사**
   - 나타나는 페이지에서 주소 복사
   - 예: `https://github.com/사용자명/field-nine-solutions.git`

---

### 로컬 코드를 GitHub에 올리기

**VS Code 터미널에서 실행:**

```powershell
# 1. 프로젝트 폴더로 이동
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

**중요:** 5번 명령어에서 `사용자명`을 본인의 GitHub 사용자명으로 바꾸세요!

---

### 다시 Vercel로 돌아가기

1. **Vercel 탭으로 돌아가기**
   - 브라우저 탭에서 Vercel 페이지 클릭

2. **새로고침**
   - `F5` 키 누르기
   - 또는 새로고침 버튼 클릭

3. **다시 GitHub 버튼 클릭**
   - 이제 `field-nine-solutions` 리포지토리가 보일 것입니다!

4. **"Connect" 버튼 클릭**

---

## ✅ 연결 완료 확인

**연결이 완료되면:**

1. **"Connected Git Repository" 섹션이 나타납니다**
   - 리포지토리 이름이 표시됩니다
   - `field-nine-solutions`가 보여야 합니다

2. **자동 배포 시작**
   - "Deployments" 탭으로 이동하면 배포가 시작됩니다
   - 약 2-3분 후 "Ready" 상태가 되면 완료!

---

## 📋 체크리스트

진행 상황을 체크하세요:

- [ ] Vercel Git 설정 페이지에서 "GitHub" 버튼 클릭
- [ ] GitHub 로그인 및 권한 허용
- [ ] `field-nine-solutions` 리포지토리가 보이는지 확인
- [ ] 리포지토리가 없다면 GitHub에서 만들기
- [ ] 로컬 코드를 GitHub에 올리기
- [ ] Vercel에서 리포지토리 연결
- [ ] 연결 완료 확인
- [ ] 자동 배포 확인

---

## 🎯 요약

**지금 바로 할 일:**
1. **"GitHub" 버튼 클릭**
2. **권한 허용**
3. **리포지토리 선택**

**리포지토리가 없다면:**
1. GitHub에서 `field-nine-solutions` 만들기
2. 로컬 코드를 GitHub에 올리기
3. 다시 Vercel에서 연결

---

## 💡 팁

**"This Project is not connected to a Git repository" 메시지:**
- 정상입니다! 아직 연결하지 않았기 때문입니다
- GitHub 버튼을 클릭하고 연결하면 사라집니다

**리포지토리를 찾을 수 없다면:**
- GitHub에서 리포지토리를 만들었는지 확인
- 로컬에서 `git push`를 했는지 확인
- Vercel 페이지를 새로고침해보세요

---

**지금 바로 "GitHub" 버튼을 클릭하세요!** 🚀
