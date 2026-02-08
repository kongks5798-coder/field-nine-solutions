# OAuth 설정 가이드 (방향 1: 즉시 상용화)

## 🎯 목표
Google 및 Kakao OAuth를 Supabase에 설정하여 소셜 로그인을 활성화합니다.

## ⏱️ 예상 소요 시간: 30분

---

## 1. Google OAuth 설정

### Step 1: Google Cloud Console 설정

1. **Google Cloud Console 접속**
   - https://console.cloud.google.com 접속
   - 프로젝트 선택 또는 새 프로젝트 생성

2. **OAuth 동의 화면 설정**
   - 좌측 메뉴: "API 및 서비스" > "OAuth 동의 화면"
   - 사용자 유형: "외부" 선택
   - 앱 정보 입력:
     - 앱 이름: `Field Nine`
     - 사용자 지원 이메일: 본인 이메일
     - 개발자 연락처 정보: 본인 이메일
   - 저장 후 계속

3. **범위 추가**
   - "범위" 섹션에서 "저장 후 계속" 클릭
   - 테스트 사용자 추가 (선택사항)

4. **OAuth 2.0 클라이언트 ID 생성**
   - 좌측 메뉴: "API 및 서비스" > "사용자 인증 정보"
   - 상단 "+ 사용자 인증 정보 만들기" > "OAuth 2.0 클라이언트 ID"
   - 애플리케이션 유형: "웹 애플리케이션"
   - 이름: `Field Nine Web Client`
   - 승인된 리디렉션 URI 추가:
     ```
     https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback
     ```
     - `[YOUR_PROJECT_REF]`는 Supabase 프로젝트 URL에서 확인
     - 예: `abcdefghijklmnop.supabase.co`
   - 만들기 클릭
   - **Client ID**와 **Client Secret** 복사 (중요!)

### Step 2: Supabase 설정

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard 접속
   - 프로젝트 선택

2. **Authentication > Providers 설정**
   - 좌측 메뉴: "Authentication" > "Providers"
   - "Google" 찾아서 클릭
   - "Enable Google provider" 토글 ON
   - **Client ID (for OAuth)** 입력: Google에서 복사한 Client ID
   - **Client Secret (for OAuth)** 입력: Google에서 복사한 Client Secret
   - "Save" 클릭

---

## 2. Kakao OAuth 설정

### Step 1: Kakao Developers 설정

1. **Kakao Developers 접속**
   - https://developers.kakao.com 접속
   - 로그인

2. **내 애플리케이션 만들기**
   - 상단 "내 애플리케이션" > "애플리케이션 추가하기"
   - 앱 이름: `Field Nine`
   - 저장

3. **플랫폼 설정**
   - "앱 설정" > "플랫폼"
   - "Web 플랫폼 등록" 클릭
   - 사이트 도메인 입력:
     ```
     https://[YOUR_PROJECT_REF].supabase.co
     ```
   - 저장

4. **Redirect URI 설정**
   - "제품 설정" > "카카오 로그인" > "활성화"
   - "Redirect URI" 섹션에서 "추가" 클릭
   - 다음 URI 추가:
     ```
     https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback
     ```
   - 저장

5. **REST API 키 확인**
   - "앱 설정" > "앱 키"
   - **REST API 키** 복사 (이게 Client ID)
   - "카카오 로그인" > "보안" > **Client Secret** 생성 및 복사

### Step 2: Supabase 설정

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard 접속
   - 프로젝트 선택

2. **Authentication > Providers 설정**
   - 좌측 메뉴: "Authentication" > "Providers"
   - "Kakao" 찾아서 클릭
   - "Enable Kakao provider" 토글 ON
   - **Client ID (for OAuth)** 입력: Kakao REST API 키
   - **Client Secret (for OAuth)** 입력: Kakao에서 생성한 Client Secret
   - "Save" 클릭

---

## 3. 테스트

1. **로컬 개발 서버 실행**
   ```bash
   npm run dev
   ```

2. **로그인 페이지 접속**
   - http://localhost:3000/login 접속

3. **Google 로그인 테스트**
   - "Google 계정으로 계속하기" 버튼 클릭
   - Google 로그인 화면으로 리디렉션되는지 확인
   - 로그인 후 대시보드로 리디렉션되는지 확인

4. **Kakao 로그인 테스트**
   - "Kakao로 3초 만에 시작하기" 버튼 클릭
   - Kakao 로그인 화면으로 리디렉션되는지 확인
   - 로그인 후 대시보드로 리디렉션되는지 확인

---

## 4. 문제 해결

### Google OAuth 오류

**"redirect_uri_mismatch" 오류**
- Google Cloud Console의 "승인된 리디렉션 URI" 확인
- Supabase 프로젝트 URL과 정확히 일치하는지 확인
- URI 끝에 슬래시(`/`)가 없는지 확인

**"unsupported_provider" 오류**
- Supabase에서 Google provider가 활성화되었는지 확인
- Client ID와 Secret이 올바르게 입력되었는지 확인

### Kakao OAuth 오류

**"redirect_uri_mismatch" 오류**
- Kakao Developers의 "Redirect URI" 확인
- Supabase 프로젝트 URL과 정확히 일치하는지 확인

**"no_relation_for_ref" 오류**
- Kakao Client Secret이 올바르게 생성되었는지 확인
- Supabase에 올바르게 입력되었는지 확인

---

## 5. 완료 체크리스트

- [ ] Google Cloud Console에서 OAuth 클라이언트 ID 생성 완료
- [ ] Google Client ID와 Secret을 Supabase에 입력 완료
- [ ] Kakao Developers에서 애플리케이션 생성 완료
- [ ] Kakao REST API 키와 Secret을 Supabase에 입력 완료
- [ ] Google 로그인 테스트 성공
- [ ] Kakao 로그인 테스트 성공

---

## 📝 참고사항

- OAuth 설정은 Supabase 대시보드에서만 가능합니다 (코드로 자동화 불가)
- 프로덕션 환경에서는 추가 보안 설정이 필요할 수 있습니다
- 테스트 환경에서는 "테스트 사용자"를 추가해야 할 수 있습니다

---

**설정 완료 후**: 다음 단계로 진행하여 나머지 기능을 구현합니다.
