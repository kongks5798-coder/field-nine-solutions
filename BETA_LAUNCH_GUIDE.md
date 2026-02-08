# 🚀 Field Nine 베타 런치 가이드

**목표:** 1주 안에 실 사용자 50~100명 모집  
**전략:** 첫 100명 무료 3개월 오퍼 + 소셜 미디어 마케팅

---

## ✅ 체크리스트

### 1. Cloudflare DNS 설정 ✅

#### 1-1. Tunnel 완전 삭제

1. **Cloudflare 대시보드 접속**
   - https://dash.cloudflare.com
   - `fieldnine.io` 도메인 선택

2. **Zero Trust → Tunnels 이동**
   - 왼쪽 메뉴: **"Zero Trust"** 클릭
   - **"Networks"** → **"Tunnels"** 클릭

3. **Tunnel 삭제**
   - 모든 Tunnel 찾기
   - 각 Tunnel 옆 **"Delete"** 버튼 클릭
   - 확인 메시지에서 **"Delete"** 확인

#### 1-2. DNS 레코드 설정

1. **DNS 관리 페이지 이동**
   - 왼쪽 메뉴: **"DNS"** → **"Records"** 클릭

2. **기존 Tunnel 레코드 삭제**
   - `_cf_tunnel` 또는 Tunnel 관련 레코드 모두 삭제

3. **Vercel CNAME 추가**

   | 타입 | 이름 | 대상 | 프록시 상태 | TTL |
   |------|------|------|------------|-----|
   | CNAME | `@` | `cname.vercel-dns.com` | **DNS only** (회색 구름) | Auto |
   | CNAME | `www` | `fieldnine.io` | **DNS only** (회색 구름) | Auto |

   **⚠️ 중요:** Proxy는 반드시 **OFF (회색 구름)**로 설정!

---

### 2. Vercel 도메인 설정 ✅

#### 2-1. 도메인 추가

1. **Vercel 대시보드 접속**
   - https://vercel.com/kaus2025/field-nine-solutions/settings/domains

2. **도메인 추가**
   - **"Add Domain"** 버튼 클릭
   - `www.fieldnine.io` 입력
   - **"Add"** 클릭

3. **도메인 검증 대기**
   - 상태가 **"Valid"** 또는 **"Valid Configuration"**로 변경될 때까지 대기
   - 일반적으로 **5-10분** 소요

#### 2-2. DNS 전파 확인

1. **DNS 전파 확인 도구 사용**
   - https://dnschecker.org
   - `fieldnine.io` 입력
   - CNAME 레코드 전파 확인

2. **접속 테스트**
   - `https://fieldnine.io` 접속 확인
   - `https://www.fieldnine.io` 접속 확인

---

### 3. 베타 페이지 설정 ✅

#### 3-1. Google Form 생성

1. **Google Form 만들기**
   - https://forms.google.com 접속
   - 새 양식 만들기

2. **필드 추가**
   - 이메일 (필수)
   - 회사명 (선택)
   - 추가 질문 (선택)

3. **Form URL 복사**
   - **"전송"** 버튼 클릭
   - **"링크"** 아이콘 클릭
   - URL 복사

4. **환경 변수 설정**
   - Vercel 대시보드 → **Settings** → **Environment Variables**
   - `NEXT_PUBLIC_GOOGLE_FORM_URL` 추가
   - 값: 복사한 Google Form URL

#### 3-2. 베타 페이지 확인

- **URL:** `https://fieldnine.io/beta`
- **기능:**
  - ✅ Waitlist form
  - ✅ 첫 100명 무료 3개월 오퍼
  - ✅ Tesla 2026 스타일 디자인
  - ✅ 반응형 디자인

---

### 4. 소셜 미디어 마케팅 ✅

#### 4-1. X(트위터) 포스트

**포스트 내용:**
```
🚀 Field Nine 베타 오픈!

AI 자동화로 비즈니스 비용 98% ↓
✅ 재고 자동 관리
✅ 주문 자동 처리
✅ 수익 최적화

🎁 첫 100명에게 3개월 무료!
👉 fieldnine.io/beta

#SaaS #AICommerce #Startup #BetaLaunch #AI #Automation
```

**포스트 시간:**
- 오전 9시 (한국 시간) - 가장 많은 조회
- 또는 오후 2시 - 점심 시간대

**이미지:**
- 베타 페이지 스크린샷
- 또는 Field Nine 로고 + "베타 오픈" 텍스트

#### 4-2. 해시태그 전략

**주요 해시태그:**
- `#SaaS`
- `#AICommerce`
- `#Startup`
- `#BetaLaunch`
- `#AI`
- `#Automation`
- `#BusinessAutomation`
- `#TechStartup`

**한국어 해시태그:**
- `#스타트업`
- `#AI자동화`
- `#비즈니스자동화`
- `#베타런치`

#### 4-3. 추가 마케팅 채널

1. **LinkedIn**
   - 비즈니스 타겟팅
   - 전문적인 포스트

2. **Facebook 그룹**
   - 스타트업 그룹
   - SaaS 그룹

3. **Reddit**
   - r/startups
   - r/SaaS
   - r/entrepreneur

4. **커뮤니티**
   - 디스코드 서버
   - 슬랙 커뮤니티

---

### 5. Product Hunt 준비 ✅

#### 5-1. Product Hunt 계정 생성

1. **Product Hunt 가입**
   - https://www.producthunt.com
   - 계정 생성

2. **제품 페이지 준비**
   - 제품 이름: "Field Nine - AI-Powered Business Automation"
   - 태그라인: "Automate inventory, orders, and revenue with RTX 5090 local AI"
   - 설명: 베타 런치 스토리 + 기능 소개

#### 5-2. 런치 자료 준비

**필수 자료:**
- ✅ 제품 스크린샷 (3-5개)
- ✅ 제품 동영상 (선택)
- ✅ 제품 로고
- ✅ 제품 설명 (영어)
- ✅ 태그라인

**런치 날짜:**
- 베타 런치 후 **1주일** 뒤
- 목요일 또는 금요일 (가장 많은 조회)

#### 5-3. 런치 전략

1. **런치 전날**
   - Product Hunt에 제품 등록
   - 런치 시간 설정 (한국 시간 오전 9시 = PST 오후 5시)

2. **런치 당일**
   - X(트위터)에 Product Hunt 링크 공유
   - 커뮤니티에 공유
   - 친구/지인에게 투표 요청

3. **런치 후**
   - 댓글 답변
   - 피드백 수집
   - 후속 포스트

---

## 📊 성과 추적

### 1. 대기열 추적

**Google Form 응답 확인:**
- Google Sheets에서 자동으로 응답 수집
- 실시간 대기열 현황 확인

**로컬 스토리지 백업:**
- 브라우저 개발자 도구 → Application → Local Storage
- `fieldnine-beta-signups` 키 확인

### 2. 목표 달성

**1주일 목표:**
- ✅ 실 사용자 50~100명
- ✅ 이메일 수집
- ✅ 피드백 수집

**지표:**
- 대기열 등록 수
- 페이지 조회수 (Google Analytics)
- 소셜 미디어 참여도

---

## 🎯 다음 단계

### 베타 런치 후 (1주일)

1. **사용자 초대**
   - 첫 100명에게 이메일 발송
   - 베타 액세스 코드 제공

2. **피드백 수집**
   - 설문조사
   - 1:1 인터뷰 (선택)
   - 사용자 행동 분석

3. **제품 개선**
   - 피드백 반영
   - 버그 수정
   - 기능 추가

4. **Product Hunt 런치**
   - 1주일 후 런치
   - 추가 사용자 확보

---

## 📝 체크리스트 요약

- [ ] Cloudflare Tunnel 삭제
- [ ] DNS 레코드 설정 (CNAME, Proxy OFF)
- [ ] Vercel 도메인 추가 및 검증
- [ ] Google Form 생성 및 환경 변수 설정
- [ ] 베타 페이지 테스트 (`/beta`)
- [ ] X(트위터) 포스트 작성 및 공유
- [ ] Product Hunt 계정 생성 및 제품 등록
- [ ] 대기열 추적 시스템 확인
- [ ] 성과 지표 설정

---

**보스, 인프라 연결까지 완벽하게 준비되었습니다!** 🚀

베타 런치 성공을 기원합니다!
