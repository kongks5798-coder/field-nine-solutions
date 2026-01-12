# 🔑 Supabase anon 키 찾기 완벽 가이드 (초보자용)

## 📋 목차
1. [Supabase 대시보드 접속](#1-supabase-대시보드-접속)
2. [프로젝트 선택](#2-프로젝트-선택)
3. [Settings 메뉴 찾기](#3-settings-메뉴-찾기)
4. [API 메뉴 클릭](#4-api-메뉴-클릭)
5. [anon 키 복사하기](#5-anon-키-복사하기)

---

## 🎯 1단계: Supabase 대시보드 접속

### 1-1. 브라우저 열기
1. 컴퓨터에서 **인터넷 브라우저**를 엽니다 (Chrome, Edge 등)
2. 주소창에 다음을 입력합니다: `supabase.com`
3. **Enter** 키를 누릅니다

### 1-2. 로그인하기
1. 화면 오른쪽 위에 있는 **"Sign In"** 또는 **"로그인"** 버튼을 찾습니다
2. 버튼을 클릭합니다
3. GitHub로 로그인:
   - **"Continue with GitHub"** 버튼 클릭
   - GitHub 아이디와 비밀번호 입력
   - **"Sign in"** 클릭

✅ **성공 확인:** Supabase 대시보드 화면이 나타나면 성공입니다!

---

## 🎯 2단계: 프로젝트 선택

### 2-1. 조직 선택
1. 대시보드 화면에서 여러 조직 카드가 보입니다
2. **프로 플랜 조직**을 찾습니다:
   - **"kongks5798@gmail.com"** (프로 플랜 • 5개 프로젝트)
   - 또는 방금 만든 프로젝트가 있는 조직
3. 조직 카드를 클릭합니다

### 2-2. 프로젝트 선택
1. 프로젝트 목록이 나타납니다
2. **"field-nine-solutions"** 프로젝트를 찾습니다
3. 프로젝트 카드를 클릭합니다

✅ **성공 확인:** 프로젝트 대시보드 화면이 나타나면 성공입니다!

---

## 🎯 3단계: Settings 메뉴 찾기

### 3-1. 왼쪽 메뉴 확인
1. 화면 왼쪽에 세로로 나열된 메뉴가 있습니다
2. 여러 아이콘과 텍스트가 보입니다:
   - Table Editor
   - SQL Editor
   - Authentication
   - Storage
   - 등등...

### 3-2. Settings 찾기
1. 왼쪽 메뉴를 **아래로** 스크롤합니다
2. **"Settings"** 또는 **"설정"** 메뉴를 찾습니다
   - 아이콘: **톱니바퀴** 모양 (⚙️)
   - 텍스트: **"Settings"** 또는 **"설정"**
3. **"Settings"**를 클릭합니다

✅ **성공 확인:** Settings 페이지가 열리면 성공입니다!

---

## 🎯 4단계: API 메뉴 클릭

### 4-1. Settings 하위 메뉴 확인
Settings를 클릭하면 왼쪽에 더 많은 메뉴가 나타납니다:

**PROJECT SETTINGS 섹션:**
- General (현재 선택된 것 같습니다)
- Compute and Disk
- Infrastructure
- Integrations
- **API** ← 이걸 찾으세요!
- JWT Keys
- Log Drains
- Add Ons
- Vault

**CONFIGURED FORMS 섹션:**
- Database
- Authentication
- Storage
- Edge Functions

### 4-2. API 메뉴 찾기
1. **"PROJECT SETTINGS"** 섹션을 찾습니다
2. 그 안에서 **"API"** 메뉴를 찾습니다
3. **"API"**를 클릭합니다

✅ **성공 확인:** API 설정 페이지가 나타나면 성공입니다!

---

## 🎯 5단계: anon 키 복사하기

### 5-1. API Keys 섹션 찾기
API 페이지가 열리면 여러 섹션이 보입니다:

**Project API keys** 섹션:
- 이 섹션에 여러 키가 표시됩니다
- 각 키는 이름과 값이 있습니다

### 5-2. anon 키 찾기
다음 키들이 보입니다:

1. **anon public** ← 이게 우리가 찾는 키입니다!
   - 이름: `anon` `public`
   - 설명: "This key is safe to use in a browser if you have enabled Row Level Security for your tables and enabled policies."
   - 값: 긴 문자열 (예: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

2. **service_role** (이건 사용하지 않습니다)
   - 이름: `service_role` `secret`
   - 설명: "This key has the ability to bypass Row Level Security. Never share it publicly."

### 5-3. anon 키 복사하기

#### 방법 1: 복사 버튼 사용 (가장 쉬움)
1. **anon public** 키를 찾습니다
2. 키 값 오른쪽에 **"Copy"** 버튼이 있습니다
3. **"Copy"** 버튼을 클릭합니다
4. ✅ 복사 완료! (클립보드에 저장됨)

#### 방법 2: 직접 선택해서 복사
1. **anon public** 키 값을 찾습니다
2. 긴 문자열을 마우스로 드래그해서 선택합니다
   - 문자열 시작 부분에서 마우스 왼쪽 버튼을 누른 채
   - 끝까지 드래그합니다
3. 선택된 텍스트에서 마우스 오른쪽 버튼 클릭
4. **"복사"** 또는 **"Copy"** 클릭
5. 또는 **Ctrl + C** 키를 누릅니다
6. ✅ 복사 완료!

### 5-4. 복사 확인
복사가 잘 되었는지 확인하려면:
1. 메모장을 엽니다
2. **Ctrl + V** 키를 누릅니다
3. 긴 문자열이 나타나면 성공입니다!

---

## 🎯 추가 정보: Project URL도 함께 복사하기

anon 키를 복사하는 동안 **Project URL**도 함께 복사하세요!

### Project URL 찾기
1. API 페이지 맨 위를 보세요
2. **"Project URL"** 또는 **"프로젝트 URL"** 섹션이 있습니다
3. URL이 표시됩니다:
   - 예: `https://vhpefsmwpoixzEpu.supabase.co`
4. **"Copy"** 버튼을 클릭하거나 직접 복사합니다

### 필요한 두 가지 정보
1. **Project URL:** `https://xxxxx.supabase.co`
2. **anon public 키:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

이 두 가지를 모두 복사해서 메모장에 저장해두세요!

---

## 📋 체크리스트

각 단계를 완료했는지 확인하세요:

- [ ] Supabase.com 접속 완료
- [ ] 로그인 완료
- [ ] 프로젝트 선택 완료
- [ ] Settings 메뉴 클릭 완료
- [ ] API 메뉴 클릭 완료
- [ ] anon public 키 찾기 완료
- [ ] 키 복사 완료
- [ ] 메모장에 붙여넣기로 확인 완료
- [ ] Project URL도 복사 완료

---

## 💡 팁

1. **키는 매우 길어요**
   - anon 키는 보통 200자 이상의 긴 문자열입니다
   - 전체를 다 복사해야 합니다

2. **공백이 들어가지 않도록 주의**
   - 복사할 때 앞뒤 공백이 들어가지 않도록 주의하세요

3. **메모장에 저장**
   - 복사한 키를 메모장에 붙여넣어서 저장해두세요
   - 나중에 Vercel에 입력할 때 사용합니다

4. **키는 비밀입니다**
   - anon 키는 공개해도 되지만, 그래도 안전하게 보관하세요

---

## 🚨 문제 해결

### 문제 1: Settings 메뉴를 찾을 수 없어요

**해결:**
1. 왼쪽 메뉴를 아래로 더 스크롤해보세요
2. 화면이 작으면 메뉴가 접혀있을 수 있습니다
3. 왼쪽 상단에 **"☰"** (햄버거 메뉴) 아이콘이 있으면 클릭해보세요

### 문제 2: API 메뉴가 안 보여요

**해결:**
1. Settings를 클릭했는지 확인하세요
2. Settings 하위 메뉴가 펼쳐져 있는지 확인하세요
3. "PROJECT SETTINGS" 섹션을 찾아보세요
4. 페이지를 새로고침해보세요 (F5 키)

### 문제 3: anon 키를 찾을 수 없어요

**해결:**
1. "Project API keys" 섹션을 찾아보세요
2. "anon" 또는 "public"이라는 단어를 찾아보세요
3. 페이지를 아래로 스크롤해보세요
4. 다른 프로젝트를 선택했는지 확인하세요

### 문제 4: 복사가 안 돼요

**해결:**
1. 키 값 전체를 선택했는지 확인하세요
2. 마우스로 드래그할 때 처음부터 끝까지 다 선택하세요
3. Ctrl + C 키를 사용해보세요
4. 브라우저를 새로고침하고 다시 시도해보세요

---

## 🎯 현재 화면에서 바로 찾기

지금 Settings 페이지에 계시다면:

1. **왼쪽 메뉴**에서 **"API"** 찾기
   - Settings 하위 메뉴에 있습니다
   - "PROJECT SETTINGS" 섹션 안에 있습니다

2. **"API"** 클릭

3. **API 페이지**에서:
   - 맨 위: **Project URL** 복사
   - 아래: **"Project API keys"** 섹션에서 **"anon public"** 키 찾기
   - **"Copy"** 버튼 클릭

---

## ✅ 완료 확인

다음 두 가지를 메모장에 저장했는지 확인하세요:

1. ✅ **Project URL:** `https://vhpefsmwpoixzEpu.supabase.co`
2. ✅ **anon public 키:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (긴 문자열)

이제 이 정보를 Vercel 환경 변수에 입력하면 됩니다!

---

**보스, 이 가이드를 따라하시면 anon 키를 쉽게 찾을 수 있습니다!** 🔑🚀
