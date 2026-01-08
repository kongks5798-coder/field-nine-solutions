# 🚨 Phase 1: Critical Issues 수정 가이드

**목표**: 6,200점 → 7,500점 (62% → 75%)  
**예상 시간**: 7시간  
**우선순위**: 🔴 Critical

---

## ✅ 1. 터미널 에러 수정 (완료)

### 해결 방법:
1. **자동 정리 스크립트 사용**:
   ```powershell
   npm run cleanup
   ```

2. **수동 정리**:
   ```powershell
   # Node 프로세스 종료
   Stop-Process -Name node -Force
   
   # dev.lock 파일 삭제
   Remove-Item .next\dev.lock -Force
   ```

### 점수 향상: +100점

---

## ✅ 2. OAuth 설정 완료

### 2.1 Google OAuth 설정

#### 단계 1: Google Cloud Console 설정
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 프로젝트 선택 또는 생성
3. **APIs & Services** > **OAuth consent screen**:
   - User Type: **External**
   - App name: `Field Nine`
   - User support email: 본인 이메일
   - Developer contact: 본인 이메일
   - **Save and Continue**

4. **Scopes** 설정:
   - `email`, `profile`, `openid` 선택
   - **Update** > **Save and Continue**

5. **Credentials** 생성:
   - **APIs & Services** > **Credentials**
   - **+ CREATE CREDENTIALS** > **OAuth client ID**
   - Application type: **Web application**
   - Name: `Field Nine Web Client`
   - **Authorized redirect URIs**:
     ```
     https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
     ```
   - **Create** 클릭
   - **Client ID**와 **Client Secret** 복사

#### 단계 2: Supabase 설정
1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택
3. **Authentication** > **Providers** > **Google**:
   - **Enable Google provider** 토글 ON
   - **Client ID (for OAuth)** 입력
   - **Client Secret (for OAuth)** 입력
   - **Save** 클릭

#### 단계 3: 테스트
1. 로그인 페이지에서 "Google 계정으로 계속하기" 클릭
2. Google 로그인 완료
3. 대시보드로 리다이렉트 확인

### 2.2 Kakao OAuth 설정

#### 단계 1: Kakao Developers 설정
1. [Kakao Developers](https://developers.kakao.com) 접속
2. 내 애플리케이션 > 애플리케이션 추가하기
3. 앱 이름: `Field Nine`
4. **플랫폼** 설정:
   - Web 플랫폼 등록
   - 사이트 도메인: `http://localhost:3000` (개발), `https://yourdomain.com` (프로덕션)
5. **카카오 로그인** 활성화:
   - **카카오 로그인** > **활성화 설정** ON
   - **Redirect URI** 등록:
     ```
     https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
     ```
6. **제품 설정** > **카카오 로그인**:
   - **동의항목** 설정:
     - 필수: 이메일, 닉네임
   - **REST API 키** 복사
   - **Client Secret** 생성 및 복사

#### 단계 2: Supabase 설정
1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택
3. **Authentication** > **Providers** > **Kakao**:
   - **Enable Kakao provider** 토글 ON
   - **Client ID (REST API Key)** 입력
   - **Client Secret** 입력
   - **Save** 클릭

#### 단계 3: 테스트
1. 로그인 페이지에서 "Kakao로 3초 만에 시작하기" 클릭
2. Kakao 로그인 완료
3. 대시보드로 리다이렉트 확인

### 점수 향상: +400점

---

## ✅ 3. 대시보드 UI 개선

### 3.1 로고 디자인 개선

**현재 문제**: 단순한 기하학적 도형

**개선 방안**:
1. 전문적인 로고 디자인
2. SVG 최적화
3. 다크/라이트 모드 지원
4. 애니메이션 효과

### 3.2 대시보드 레이아웃 개선

**현재 문제**: 기본적인 레이아웃만 존재

**개선 방안**:
1. 모던한 그리드 레이아웃
2. 카드 기반 위젯 시스템
3. 차트 및 그래프 추가
4. 실시간 데이터 표시

### 3.3 반응형 디자인

**현재 문제**: 모바일 최적화 미흡

**개선 방안**:
1. 모바일 퍼스트 디자인
2. 터치 친화적 인터페이스
3. 반응형 사이드바

### 점수 향상: +800점

---

## 📋 체크리스트

### 터미널 에러 수정
- [x] Node 프로세스 정리 스크립트 추가
- [x] dev.lock 파일 자동 정리
- [ ] 테스트 완료

### OAuth 설정
- [ ] Google OAuth 설정 완료
- [ ] Kakao OAuth 설정 완료
- [ ] 테스트 완료

### 대시보드 UI 개선
- [ ] 로고 디자인 개선
- [ ] 대시보드 레이아웃 개선
- [ ] 반응형 디자인 적용
- [ ] 테스트 완료

---

## 🎯 Phase 1 완료 후 예상 점수

**현재**: 6,200점 (62%)  
**Phase 1 완료 후**: 7,500점 (75%)  
**향상**: +1,300점

---

**다음 단계**: Phase 2 - High Priority Issues 수정
