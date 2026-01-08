# 🎯 GitHub에서 Vercel 연결하기 (초등학생도 따라하는 가이드)

**현재 상황:** GitHub 설정 페이지에서 Vercel 통합을 설정해야 합니다.

---

## 📋 지금 보이는 화면 설명

**왼쪽 메뉴:**
- `등록된 프로그램` (Registered programs) - 현재 여기에 있습니다
- `베르셀` (Vercel) - 이것을 설정해야 합니다

**오른쪽 화면:**
- `저장소 접근` (Repository Access) 섹션이 보입니다
- 두 가지 옵션이 있습니다:
  1. `모든 저장소` (All repositories)
  2. `선택한 저장소` (Selected repositories) ← 현재 이것이 선택되어 있음

---

## ✅ 해결 방법 (2가지 중 선택)

### 방법 1: 모든 저장소 허용 (가장 쉬움) ⭐ 권장

**이 방법을 추천합니다!** 간단하고 빠릅니다.

#### 단계별 안내:

1. **"저장소 접근" (Repository Access) 섹션 찾기**
   - 화면 오른쪽에 있습니다
   - 두 개의 라디오 버튼이 있습니다

2. **"모든 저장소" (All repositories) 선택**
   - 첫 번째 옵션을 클릭하세요
   - 원 모양 버튼을 클릭하면 선택됩니다

3. **저장하기**
   - 페이지 하단에 "Save" 또는 "저장" 버튼이 있을 수 있습니다
   - 자동으로 저장될 수도 있습니다

4. **완료!**
   - 이제 Vercel이 모든 GitHub 저장소에 접근할 수 있습니다

---

### 방법 2: 특정 저장소만 선택하기

**나중에 `field-nine-solutions` 저장소를 만들었을 때 사용하는 방법입니다.**

#### 단계별 안내:

1. **"선택한 저장소" (Selected repositories) 선택**
   - 두 번째 옵션을 클릭하세요
   - 이미 선택되어 있을 수 있습니다

2. **저장소 목록 보기**
   - "Configure" 또는 "설정" 버튼을 클릭하세요
   - 저장소 목록이 나타납니다

3. **저장소 선택**
   - `field-nine-solutions` 저장소를 찾아서 체크하세요
   - 아직 만들지 않았다면 나중에 추가할 수 있습니다

4. **저장하기**
   - "Save" 또는 "저장" 버튼 클릭

---

## 🎯 지금 바로 할 일

### 추천: 방법 1 (모든 저장소 허용)

**이유:**
- ✅ 가장 간단합니다
- ✅ 나중에 저장소를 만들어도 자동으로 연결됩니다
- ✅ 설정이 한 번이면 끝입니다

**단계:**
1. **"모든 저장소" (All repositories) 클릭**
2. **완료!**

---

## 📋 다음 단계

GitHub 설정을 완료한 후:

### 1. GitHub에서 리포지토리 만들기

1. **GitHub 웹사이트 접속:**
   ```
   https://github.com
   ```

2. **오른쪽 위 "+" 버튼 클릭**
3. **"New repository" 클릭**
4. **Repository name 입력:**
   ```
   field-nine-solutions
   ```
5. **"Create repository" 버튼 클릭**

---

### 2. 로컬 코드를 GitHub에 올리기

VS Code 터미널에서 실행:

```powershell
# 프로젝트 폴더로 이동
cd c:\Users\polor\field-nine-solutions

# Git 초기화 (처음 한 번만)
git init

# 모든 파일 추가
git add .

# 커밋 (저장)
git commit -m "Initial commit: Field Nine Solutions with PWA"

# GitHub 리포지토리 연결 (사용자명을 본인 것으로 변경!)
git remote add origin https://github.com/사용자명/field-nine-solutions.git

# 메인 브랜치로 설정
git branch -M main

# GitHub에 올리기
git push -u origin main
```

**중요:** `사용자명`을 본인의 GitHub 사용자명으로 바꾸세요!

---

### 3. Vercel에서 리포지토리 연결

1. **Vercel 대시보드 접속:**
   ```
   https://vercel.com/dashboard
   ```

2. **프로젝트 선택:**
   - `field-nine-solutions` 프로젝트 클릭

3. **Settings > Git 이동:**
   - 왼쪽 메뉴에서 "Settings" 클릭
   - "Git" 클릭

4. **리포지토리 찾기:**
   - "Search..." 검색창에 `field-nine-solutions` 입력
   - 리스트에서 찾기

5. **"Connect" 버튼 클릭**

6. **완료!**
   - 이제 `git push`만 하면 자동 배포됩니다!

---

## ✅ 체크리스트

진행 상황을 체크하세요:

- [ ] GitHub 설정에서 "모든 저장소" 선택
- [ ] GitHub에서 `field-nine-solutions` 리포지토리 생성
- [ ] 로컬에서 Git 설정 및 푸시
- [ ] Vercel에서 리포지토리 연결
- [ ] 자동 배포 확인

---

## 🎉 완료!

**이제 Tesla처럼 자동 업데이트가 가능합니다!**

- 코드 수정 → `git push` → 자동 배포 → fieldnine.io 업데이트

---

## 💡 팁

**"모든 저장소"를 선택해도 안전한가요?**
- 네, 안전합니다!
- Vercel은 배포할 때만 저장소에 접근합니다
- 코드를 읽거나 수정하지 않습니다
- 배포만 할 수 있습니다

**나중에 특정 저장소만 허용하고 싶다면?**
- 언제든지 설정을 변경할 수 있습니다
- "선택한 저장소"로 변경하고 원하는 저장소만 선택하면 됩니다

---

**지금 바로 "모든 저장소"를 선택하세요!** 🚀
