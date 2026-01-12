# 🔑 Supabase anon 키 찾기 (초보자용 - 그림으로 설명)

## 🎯 목표
Supabase에서 **anon 키**를 찾아서 복사하기

---

## 📍 현재 위치 확인

지금 Supabase Settings 페이지에 계신가요?
- ✅ 맞다면 → **4단계**로 바로 가세요
- ❌ 아니면 → **1단계**부터 시작하세요

---

## 🎬 1단계: Supabase 접속 (1분)

### 1-1. 브라우저에서 Supabase 열기
1. 브라우저 주소창에 입력: `supabase.com`
2. **Enter** 키 누르기

### 1-2. 로그인
1. 오른쪽 위 **"Sign In"** 버튼 클릭
2. **"Continue with GitHub"** 클릭
3. GitHub 로그인

✅ **확인:** 대시보드 화면이 보이면 성공!

---

## 🎬 2단계: 프로젝트 선택 (30초)

### 2-1. 조직 선택
1. 화면에 여러 카드가 보입니다
2. **"kongks5798@gmail.com"** (프로 플랜) 카드 클릭
   - 또는 프로젝트가 있는 조직 클릭

### 2-2. 프로젝트 선택
1. 프로젝트 목록이 나타납니다
2. **"field-nine-solutions"** 클릭

✅ **확인:** 프로젝트 대시보드가 보이면 성공!

---

## 🎬 3단계: Settings 메뉴 찾기 (30초)

### 3-1. 왼쪽 메뉴 보기
1. 화면 왼쪽에 세로 메뉴가 있습니다
2. 여러 아이콘과 글자가 보입니다

### 3-2. Settings 찾기
1. 왼쪽 메뉴를 **아래로** 스크롤합니다
2. **톱니바퀴 아이콘** (⚙️) 찾기
3. 그 옆에 **"Settings"** 또는 **"설정"** 글자 찾기
4. **"Settings"** 클릭

✅ **확인:** Settings 페이지가 열리면 성공!

---

## 🎬 4단계: API 메뉴 클릭 (30초)

### 4-1. Settings 하위 메뉴 보기
Settings를 클릭하면 왼쪽에 더 많은 메뉴가 나타납니다:

```
PROJECT SETTINGS
├─ General          ← 지금 여기
├─ Compute and Disk
├─ Infrastructure
├─ Integrations
├─ API              ← 이걸 클릭하세요!
├─ JWT Keys
└─ ...
```

### 4-2. API 클릭
1. **"PROJECT SETTINGS"** 섹션 찾기
2. 그 안에서 **"API"** 찾기
3. **"API"** 클릭

✅ **확인:** API 설정 페이지가 나타나면 성공!

---

## 🎬 5단계: anon 키 찾기 및 복사 (1분)

### 5-1. API 페이지 보기
API 페이지가 열리면 여러 섹션이 보입니다:

**맨 위:**
- **Project URL** 섹션
  - URL: `https://vhpefsmwpoixzEpu.supabase.co`
  - 이것도 함께 복사하세요!

**아래:**
- **Project API keys** 섹션
  - 여기에 여러 키가 있습니다

### 5-2. anon 키 찾기
**Project API keys** 섹션에서:

1. **"anon"** 이라고 적힌 키 찾기
   - 이름: `anon` `public`
   - 설명: "This key is safe to use in a browser..."

2. **키 값** 찾기
   - 매우 긴 문자열입니다
   - 예: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocGVmc213cG9peHpFcHUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY3MzQ1Njg5MCwiZXhwIjoxOTg5MDMyODkwfQ...`
   - (실제로는 더 깁니다!)

### 5-3. 키 복사하기

#### 가장 쉬운 방법: Copy 버튼 사용
1. **anon public** 키를 찾습니다
2. 키 값 오른쪽에 **"Copy"** 버튼이 있습니다
3. **"Copy"** 버튼을 클릭합니다
4. ✅ 복사 완료!

#### 다른 방법: 직접 선택해서 복사
1. 키 값(긴 문자열)을 마우스로 드래그해서 선택
2. **Ctrl + C** 키 누르기
3. ✅ 복사 완료!

### 5-4. 복사 확인
1. 메모장을 엽니다
2. **Ctrl + V** 키를 누릅니다
3. 긴 문자열이 나타나면 성공! ✅

---

## 📋 함께 복사해야 할 것

API 페이지에서 **두 가지**를 복사하세요:

### 1. Project URL
- 위치: 페이지 맨 위
- 값: `https://vhpefsmwpoixzEpu.supabase.co`
- 복사: **"Copy"** 버튼 클릭

### 2. anon public 키
- 위치: "Project API keys" 섹션
- 이름: `anon` `public`
- 복사: **"Copy"** 버튼 클릭

---

## ✅ 완료 체크리스트

- [ ] Supabase.com 접속
- [ ] 로그인
- [ ] 프로젝트 선택
- [ ] Settings 클릭
- [ ] API 클릭
- [ ] Project URL 복사
- [ ] anon public 키 복사
- [ ] 메모장에 붙여넣기로 확인

---

## 💡 팁

1. **키는 매우 깁니다**
   - 200자 이상의 긴 문자열입니다
   - 전체를 다 복사해야 합니다

2. **공백 주의**
   - 복사할 때 앞뒤 공백이 들어가지 않도록 주의

3. **메모장에 저장**
   - 복사한 키를 메모장에 붙여넣어서 저장
   - 나중에 Vercel에 입력할 때 사용

4. **두 가지 모두 복사**
   - Project URL과 anon 키 둘 다 필요합니다

---

## 🚨 문제 해결

### Settings를 찾을 수 없어요
→ 왼쪽 메뉴를 아래로 더 스크롤해보세요

### API 메뉴가 안 보여요
→ Settings를 먼저 클릭했는지 확인하세요

### anon 키를 찾을 수 없어요
→ "Project API keys" 섹션을 찾아보세요

### 복사가 안 돼요
→ 키 값 전체를 선택하고 Ctrl + C를 사용하세요

---

## 🎯 다음 단계

anon 키를 복사했으면:
1. 메모장에 저장
2. Vercel 환경 변수에 입력
3. 배포 완료!

---

**보스, 이 가이드를 따라하시면 anon 키를 쉽게 찾을 수 있습니다!** 🔑🚀
