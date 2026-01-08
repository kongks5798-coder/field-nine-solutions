# ⚡ OAuth 빠른 수정 가이드

## 🚨 현재 에러

- Google: `"unsupported_provider" "missing_auth_secret"`
- Kakao: `"unsupported provider: provider is not enabled"`

**원인**: Supabase 대시보드에서 OAuth 프로바이더가 활성화되지 않음

---

## ✅ 5분 안에 해결하기

### 1단계: Supabase 대시보드 접속 (1분)

1. https://app.supabase.com 접속
2. 프로젝트 선택
3. 왼쪽 메뉴: **Authentication** > **Providers**

### 2단계: Google 활성화 (2분)

1. **Google** 카드 찾기
2. **Enable Google** 토글을 **ON**으로 변경
3. Google Cloud Console에서 Client ID/Secret 가져오기:
   - https://console.cloud.google.com 접속
   - 프로젝트 선택 > **APIs & Services** > **Credentials**
   - OAuth 2.0 Client ID 생성 (없는 경우)
   - **Authorized redirect URIs**에 추가:
     ```
     https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
     ```
   - Client ID와 Secret 복사
4. Supabase에 붙여넣기
5. **Save** 클릭

### 3단계: Kakao 활성화 (2분)

1. **Kakao** 카드 찾기 (없으면 Custom Provider 추가)
2. **Enable Kakao** 토글을 **ON**으로 변경
3. Kakao Developers에서 키 가져오기:
   - https://developers.kakao.com 접속
   - 내 애플리케이션 > 앱 선택
   - **앱 키**에서 REST API 키 복사
   - **제품 설정** > **카카오 로그인** > **Redirect URI**에 추가:
     ```
     https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
     ```
   - Client Secret 복사
4. Supabase에 붙여넣기
5. **Save** 클릭

---

## 🔍 프로젝트 ID 확인

Supabase 대시보드 > **Settings** > **API** > **Project URL**에서 확인:
```
https://abcdefghijklmnop.supabase.co
```
`abcdefghijklmnop` 부분이 프로젝트 ID입니다.

---

## ✅ 테스트

1. 개발 서버 재시작:
   ```bash
   npm run dev
   ```

2. http://localhost:3000/login 접속

3. Google/Kakao 버튼 클릭

4. 로그인 화면으로 리다이렉트되면 성공!

---

**자세한 설정 방법**: `SUPABASE_OAUTH_SETUP_GUIDE.md` 참고
