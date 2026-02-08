# 🔐 Supabase OAuth 설정 완벽 가이드

## 🚨 현재 문제

Google/Kakao 로그인이 작동하지 않는 이유:
- Supabase 대시보드에서 OAuth 프로바이더가 활성화되지 않음
- OAuth 클라이언트 ID/Secret이 설정되지 않음
- 리다이렉트 URL이 등록되지 않음

---

## ✅ Google OAuth 설정 (완벽 가이드)

### 1단계: Google Cloud Console 설정

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com 접속
   - 프로젝트 선택 또는 새 프로젝트 생성

2. **OAuth 동의 화면 설정**
   - 왼쪽 메뉴: **APIs & Services** > **OAuth consent screen**
   - User Type: **External** 선택
   - 앱 정보 입력:
     - App name: `Field Nine`
     - User support email: 본인 이메일
     - Developer contact: 본인 이메일
   - **Save and Continue** 클릭

3. **Scopes 설정**
   - **Add or Remove Scopes** 클릭
   - 다음 스코프 선택:
     - `email`
     - `profile`
     - `openid`
   - **Update** 클릭
   - **Save and Continue** 클릭

4. **Test users 추가** (개발 단계)
   - 테스트할 이메일 주소 추가
   - **Save and Continue** 클릭

5. **Credentials 생성**
   - 왼쪽 메뉴: **APIs & Services** > **Credentials**
   - 상단 **+ CREATE CREDENTIALS** > **OAuth client ID** 선택
   - Application type: **Web application**
   - Name: `Field Nine Web Client`
   - **Authorized redirect URIs** 추가:
     ```
     https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
     ```
     - `YOUR_PROJECT_ID`는 Supabase 프로젝트 ID로 교체
     - 예시: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`
   - **Create** 클릭
   - **Client ID**와 **Client Secret** 복사 (중요!)

---

### 2단계: Supabase 대시보드 설정

1. **Supabase 대시보드 접속**
   - https://app.supabase.com 접속
   - 프로젝트 선택

2. **Authentication > Providers 메뉴로 이동**
   - 왼쪽 메뉴: **Authentication** > **Providers**

3. **Google 프로바이더 활성화**
   - **Google** 카드 찾기
   - **Enable Google** 토글을 **ON**으로 변경
   - **Client ID (for OAuth)** 입력:
     - Google Cloud Console에서 복사한 Client ID 붙여넣기
   - **Client Secret (for OAuth)** 입력:
     - Google Cloud Console에서 복사한 Client Secret 붙여넣기
   - **Save** 클릭

4. **리다이렉트 URL 확인**
   - Supabase가 자동으로 설정함:
     ```
     https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
     ```
   - Google Cloud Console의 Authorized redirect URIs와 일치하는지 확인

---

## ✅ Kakao OAuth 설정 (완벽 가이드)

### 1단계: Kakao Developers 설정

1. **Kakao Developers 접속**
   - https://developers.kakao.com 접속
   - 로그인

2. **내 애플리케이션 생성**
   - 상단 **내 애플리케이션** 클릭
   - **애플리케이션 추가하기** 클릭
   - 앱 정보 입력:
     - 앱 이름: `Field Nine`
     - 사업자명: 본인 이름 또는 회사명
   - **저장** 클릭

3. **앱 키 확인**
   - 생성된 앱 선택
   - **앱 키** 섹션에서 **REST API 키** 복사 (중요!)

4. **플랫폼 설정**
   - 왼쪽 메뉴: **앱 설정** > **플랫폼**
   - **Web 플랫폼 등록** 클릭
   - 사이트 도메인 입력:
     ```
     http://localhost:3000
     https://YOUR_PROJECT_ID.supabase.co
     ```
   - **저장** 클릭

5. **카카오 로그인 활성화**
   - 왼쪽 메뉴: **제품 설정** > **카카오 로그인**
   - **활성화 설정**을 **ON**으로 변경
   - **Redirect URI** 추가:
     ```
     https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
     ```
     - `YOUR_PROJECT_ID`는 Supabase 프로젝트 ID로 교체
   - **저장** 클릭

6. **동의 항목 설정**
   - 왼쪽 메뉴: **제품 설정** > **카카오 로그인** > **동의항목**
   - 필수 동의 항목:
     - **닉네임** (필수)
     - **프로필 사진** (선택)
     - **카카오계정(이메일)** (필수)
   - **저장** 클릭

---

### 2단계: Supabase 대시보드 설정

1. **Supabase 대시보드 접속**
   - https://app.supabase.com 접속
   - 프로젝트 선택

2. **Authentication > Providers 메뉴로 이동**
   - 왼쪽 메뉴: **Authentication** > **Providers**

3. **Kakao 프로바이더 활성화**
   - **Kakao** 카드 찾기 (없으면 Custom Provider로 추가)
   - **Enable Kakao** 토글을 **ON**으로 변경
   - **Client ID (for OAuth)** 입력:
     - Kakao Developers에서 복사한 REST API 키 붙여넣기
   - **Client Secret (for OAuth)** 입력:
     - Kakao Developers > **제품 설정** > **카카오 로그인** > **Client Secret** 복사
   - **Save** 클릭

4. **리다이렉트 URL 확인**
   - Supabase가 자동으로 설정함:
     ```
     https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
     ```
   - Kakao Developers의 Redirect URI와 일치하는지 확인

---

## 🔍 Supabase 프로젝트 ID 확인 방법

1. Supabase 대시보드 접속
2. 프로젝트 선택
3. 왼쪽 메뉴: **Settings** > **API**
4. **Project URL**에서 프로젝트 ID 확인:
   ```
   https://abcdefghijklmnop.supabase.co
   ```
   - `abcdefghijklmnop` 부분이 프로젝트 ID입니다

---

## ✅ 설정 완료 확인

### Google 로그인 테스트:
1. http://localhost:3000/login 접속
2. **Google 계정으로 계속하기** 버튼 클릭
3. Google 로그인 화면으로 리다이렉트되어야 함
4. 로그인 후 대시보드로 이동해야 함

### Kakao 로그인 테스트:
1. http://localhost:3000/login 접속
2. **Kakao로 3초 만에 시작하기** 버튼 클릭
3. Kakao 로그인 화면으로 리다이렉트되어야 함
4. 로그인 후 대시보드로 이동해야 함

---

## 🚨 문제 해결

### "unsupported provider" 에러가 발생하는 경우:
1. Supabase 대시보드에서 프로바이더가 **Enabled** 상태인지 확인
2. Client ID와 Client Secret이 올바르게 입력되었는지 확인
3. Supabase 프로젝트를 재시작 (Settings > General > Restart project)

### "redirect_uri_mismatch" 에러가 발생하는 경우:
1. Google Cloud Console / Kakao Developers의 Redirect URI 확인
2. Supabase 콜백 URL과 정확히 일치하는지 확인:
   ```
   https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
   ```
3. 프로토콜(`https://`)과 경로(`/auth/v1/callback`)가 정확한지 확인

### "invalid_client" 에러가 발생하는 경우:
1. Client ID와 Client Secret을 다시 복사하여 붙여넣기
2. 공백이나 줄바꿈이 포함되지 않았는지 확인
3. Supabase 대시보드에서 **Save** 버튼을 다시 클릭

---

## 📝 체크리스트

### Google OAuth:
- [ ] Google Cloud Console 프로젝트 생성
- [ ] OAuth 동의 화면 설정 완료
- [ ] OAuth Client ID/Secret 생성
- [ ] Authorized redirect URI 등록
- [ ] Supabase에서 Google 프로바이더 활성화
- [ ] Client ID/Secret 입력
- [ ] 로그인 테스트 성공

### Kakao OAuth:
- [ ] Kakao Developers 앱 생성
- [ ] REST API 키 확인
- [ ] Web 플랫폼 등록
- [ ] 카카오 로그인 활성화
- [ ] Redirect URI 등록
- [ ] Client Secret 확인
- [ ] Supabase에서 Kakao 프로바이더 활성화
- [ ] Client ID/Secret 입력
- [ ] 로그인 테스트 성공

---

**설정 완료 후 개발 서버를 재시작하세요!**

```bash
npm run dev
```
