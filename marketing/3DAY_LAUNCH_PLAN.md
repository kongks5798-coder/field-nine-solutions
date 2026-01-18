# K-Universal 3일 압축 런칭 플랜

> **목표**: 3일 만에 10,000+ 가입자 확보, Product Hunt #1 달성

---

## 전체 타임라인 요약

| 단계 | 날짜 | 핵심 활동 | 목표 |
|------|------|-----------|------|
| **D-0** | 오늘 | 준비 작업 완료 | 모든 자산 준비 |
| **Day 1** | 내일 | Product Hunt + r/korea | 3,000+ 가입 |
| **Day 2** | 모레 | r/expats + r/digitalnomad + Twitter 폭격 | 5,000+ 가입 |
| **Day 3** | D+2 | 총정리 + 2차 공략 + 후속 조치 | 2,000+ 가입 |

---

# D-0: 준비 단계 (오늘 완료)

## 1. 계정 준비 체크리스트

### Product Hunt
- [ ] **계정 생성**: https://www.producthunt.com/
- [ ] **프로필 완성**: 사진, 바이오, SNS 링크
- [ ] **Maker 프로필**: 설정 → "I'm a maker" 활성화
- [ ] **Hunter 연결**: 유명 헌터에게 DM (선택사항)

### Reddit
- [ ] **계정 확인**: 최소 7일 이상 된 계정 필요
- [ ] **카르마 확보**: 다른 서브레딧에 댓글 몇 개 작성 (10+ karma)
- [ ] **서브레딧 가입**: r/korea, r/expats, r/digitalnomad

### Twitter/X
- [ ] **계정**: @k_universal 또는 @fieldnine_io
- [ ] **프로필 완성**: 로고, 바이오, 웹사이트 링크
- [ ] **첫 트윗 작성**: 소개 + 런칭 예고

### LinkedIn
- [ ] **회사 페이지 생성**: Field Nine / K-Universal
- [ ] **개인 프로필 업데이트**: Founder 타이틀

---

## 2. 콘텐츠 자산 준비

### 스크린샷 5장 (필수)

| # | 화면 | 파일명 | 설명 |
|---|------|--------|------|
| 1 | 랜딩 페이지 | `screenshot_01_landing.png` | Hero 섹션, 태그라인 강조 |
| 2 | 여권 OCR | `screenshot_02_passport_ocr.png` | 업로드 → 2초 인식 결과 |
| 3 | Ghost Wallet | `screenshot_03_wallet.png` | 카드 플립 애니메이션 |
| 4 | 대시보드 | `screenshot_04_dashboard.png` | K-Lifestyle 서비스 맵 |
| 5 | 모바일 뷰 | `screenshot_05_mobile.png` | 반응형 디자인 |

**촬영 방법**:
```bash
# 브라우저에서 캡처
1. https://www.fieldnine.io 접속
2. F12 → 디바이스 툴바 (1280x720 또는 1920x1080)
3. 각 화면 스크린샷 저장
4. 필요시 Figma/Canva로 목업 추가
```

**저장 위치**: `marketing/assets/screenshots/`

---

### 60초 데모 영상 (필수)

**스크립트 타임라인**:

| 시간 | 화면 | 나레이션/텍스트 |
|------|------|-----------------|
| 0:00-0:05 | 검은 화면 → 텍스트 | "Moving to a new country?" |
| 0:05-0:10 | 문제 장면 | "Your identity doesn't work here." |
| 0:10-0:15 | K-Universal 로고 | "Introducing K-Universal" |
| 0:15-0:25 | 여권 스캔 데모 | "Verify in 2 seconds" (실제 OCR 시연) |
| 0:25-0:35 | Ghost Wallet | "Spend anywhere instantly" |
| 0:35-0:45 | K-Lifestyle 서비스 | "Book taxis, order food, live like a local" |
| 0:45-0:55 | 통계 + 보안 | "99% accuracy. Bank-level security." |
| 0:55-1:00 | CTA | "Try free at fieldnine.io" |

**제작 방법**:
```bash
# 옵션 1: 화면 녹화 (빠름)
- OBS Studio 또는 Loom 사용
- 1920x1080, 30fps
- 음악: Envato Elements 또는 무료 트랙

# 옵션 2: 편집 (품질 높음)
- CapCut, Premiere Pro, DaVinci Resolve
- 텍스트 오버레이 추가
- 트랜지션 효과

# 업로드
- YouTube (Unlisted) 또는 Vimeo
- 링크 복사해서 Product Hunt에 사용
```

**저장 위치**: YouTube 업로드 후 링크 보관

---

### 얼리 서포터 10명 모집 (필수)

**대상**:
- 친구/가족 중 Product Hunt 계정 있는 사람
- 동료 개발자/스타트업 창업자
- 온라인 커뮤니티 (디스코드, 슬랙 등)

**메시지 템플릿**:
```
안녕하세요! 내일 Product Hunt에 런칭합니다.

K-Universal - 외국인을 위한 여권 인증 + 지갑 서비스입니다.

런칭 시간에 upvote + 댓글 부탁드려도 될까요?
(댓글은 간단한 응원이면 충분합니다!)

링크는 내일 12:01 AM PST에 공유할게요.
미리 감사합니다! 🙏
```

**목록 관리**:
| # | 이름 | 연락처 | PH 계정 | 확인 |
|---|------|--------|---------|------|
| 1 |      |        |         | [ ]  |
| 2 |      |        |         | [ ]  |
| ... | ... | ... | ... | ... |
| 10 |     |        |         | [ ]  |

---

## 3. 기술 점검

### 서버 상태 확인
```bash
# Health Check
curl https://www.fieldnine.io/api/health

# 응답 확인
{"status":"ok","environment":"production","version":"3.0.0"}
```

### 모니터링 대시보드
- [ ] War Room 접속: https://www.fieldnine.io/admin/ops
- [ ] Google Analytics 4 확인
- [ ] Sentry 에러 모니터링 확인

### 부하 테스트 (선택)
```bash
# 간단한 부하 테스트
npx loadtest -n 1000 -c 50 https://www.fieldnine.io/
```

---

## 4. 소셜 미디어 포스트 사전 작성

### Twitter 포스트 시리즈

**런칭 발표 (Day 1)**:
```
🚀 We're LIVE on Product Hunt!

K-Universal: The Future of Identity for Global Citizens

✅ 2-second passport verification
✅ Ghost Wallet (spend anywhere)
✅ No local phone/bank needed

Built by an expat, for 50M global citizens.

👉 [Product Hunt 링크]

#ProductHunt #Fintech #DigitalNomad
```

**통계 강조 (Day 1)**:
```
Moving to a new country?

Your old identity doesn't work here:
❌ Banks reject foreign passports
❌ Apps need local phone numbers
❌ KYC takes 3-7 days

We built K-Universal to fix this:
✅ 99% accurate passport OCR
✅ 2-second verification
✅ Works in 1M+ merchants

Try free: fieldnine.io
```

**창업자 스토리 (Day 2)**:
```
3 years ago, I moved to Seoul.

Day 1: Bank rejected my passport
Day 2: Apps needed Korean number
Day 3: I couldn't order food

So I built K-Universal.

Today: 10,000+ global citizens use it.

The future of identity is portable. 🌍

fieldnine.io
```

---

# Day 1: Product Hunt + r/korea 동시 공략

## 타임라인 (KST 기준)

| 시간 (KST) | PST | 활동 | 담당 |
|------------|-----|------|------|
| **오후 5:00** | 12:01 AM | Product Hunt 제출 | 필수 |
| 오후 5:05 | 12:05 AM | Founder 댓글 작성 | 필수 |
| 오후 5:10 | 12:10 AM | 얼리 서포터에게 링크 전송 | 필수 |
| 오후 5:30 | 12:30 AM | Twitter 런칭 포스트 | 필수 |
| 오후 6:00-10:00 | 1-5 AM | PH 댓글 모니터링 (5분마다) | 필수 |
| **오후 9:00** | 4:00 AM | r/korea 포스트 | 필수 |
| 오후 9:05 | 4:05 AM | 첫 댓글 (추가 컨텍스트) | 필수 |
| 오후 9:00-자정 | 4-7 AM | Reddit 댓글 응답 | 필수 |
| 다음날 오전 | 오후 | PH 랭킹 확인 + 2차 푸시 | 중요 |

---

## Product Hunt 제출 가이드

### Step 1: 제출 페이지 접속
```
https://www.producthunt.com/posts/new
```

### Step 2: 기본 정보 입력

| 필드 | 입력값 |
|------|--------|
| **Name** | K-Universal |
| **Tagline** | The Future of Identity for Global Citizens |
| **Website** | https://www.fieldnine.io |
| **Topics** | Fintech, Developer Tools, Artificial Intelligence, Travel |

### Step 3: 미디어 업로드
- **Thumbnail**: 로고 또는 히어로 이미지 (240x240)
- **Gallery**: 스크린샷 5장 (1270x760 권장)
- **Video**: YouTube/Vimeo 링크

### Step 4: 상세 설명
```markdown
## 🛂 The Problem

50 million people move across borders every year. They all face the same barriers:
- Banks reject foreign passports
- Apps require local phone numbers
- KYC takes 3-7 days and costs $50-200

## ✨ The Solution

K-Universal is the first unified identity platform for global citizens:

**Passport OCR (2 seconds)**
- Upload passport photo
- GPT-4 Vision extracts all data (99% accuracy)
- Encrypted with AES-256

**Ghost Wallet**
- Top up with any credit card
- Spend at 1M+ merchants
- Non-custodial (your keys, your money)

**K-Lifestyle**
- Book taxis without local phone
- Order food in English
- AI-powered restaurant discovery

## 🔒 Security

- Bank-level encryption (AES-256)
- Zero-knowledge architecture
- GDPR compliant
- Regular security audits

## 🚀 Try It Free

https://www.fieldnine.io

First 1,000 users get lifetime premium features!
```

### Step 5: Founder 댓글 (즉시 작성)

```markdown
Hi Product Hunt! 👋

I'm the founder of K-Universal.

**Why I built this:**

Three years ago, I moved to Seoul as an expat. On day 1:
- Bank rejected my passport
- Apps needed a Korean phone number
- I couldn't even order food

I realized: **Your identity doesn't travel with you.**

So I built K-Universal - the first universal identity platform for the 50M people who move across borders every year.

**What makes us different:**
- 🛂 99% accurate passport OCR (GPT-4 Vision)
- 👻 Non-custodial wallet (your keys, your money)
- 🌏 Works in Korea today, everywhere tomorrow

We're live at https://fieldnine.io - would love your feedback!

**Question for the PH community:**
What identity challenges have YOU faced abroad? 💬
```

---

## r/korea 포스트 가이드

### 타이밍
- **최적 시간**: 오후 9:00 KST (한국 퇴근 후 + 미국 오전)
- **이유**: 한국 거주 외국인들이 가장 활발한 시간

### 포스트 제목
```
Built a tool for foreigners in Korea - 2-second passport verification + Ghost Wallet (no alien registration needed)
```

### 포스트 본문
> `marketing/REDDIT_LAUNCH_POSTS.md`의 r/korea 버전 사용

### 첫 댓글 (고정용)
```markdown
**Quick FAQ:**

**Q: Is this safe?**
A: Yes! AES-256 encryption + zero-knowledge architecture. We can't see your data even if we wanted to.

**Q: Do I need alien registration?**
A: Nope! That's the whole point. Works with just your passport.

**Q: How do you make money?**
A: Currently free (beta). Future: small transaction fees + premium features.

**Q: When will [feature] be available?**
A: Check our roadmap: fieldnine.io/roadmap

**P.S.** - We're also on Product Hunt today if you want to show support! [link]
```

---

## Day 1 성과 목표

| 지표 | 최소 | 목표 | 홈런 |
|------|------|------|------|
| PH Upvotes | 200 | 500 | 1,000+ |
| PH Comments | 30 | 100 | 200+ |
| PH Ranking | Top 10 | Top 5 | #1 |
| r/korea Upvotes | 100 | 500 | 1,000+ |
| r/korea Comments | 30 | 100 | 200+ |
| **총 가입자** | 1,000 | 3,000 | 5,000+ |

---

# Day 2: r/expats + r/digitalnomad + Twitter 폭격

## 타임라인 (KST 기준)

| 시간 (KST) | UTC | 활동 |
|------------|-----|------|
| 오전 9:00 | 00:00 | 전날 성과 정리 + 스크린샷 |
| 오전 10:00 | 01:00 | Twitter 2차 포스트 (성과 공유) |
| **오전 11:00** | 02:00 | r/digitalnomad 포스트 (미국 저녁) |
| 오전 11:00-오후 3:00 | 02:00-06:00 | r/digitalnomad 댓글 응답 |
| **오후 3:00** | 06:00 | r/expats 포스트 (유럽 오후) |
| 오후 3:00-9:00 | 06:00-12:00 | r/expats 댓글 응답 |
| 오후 6:00 | 09:00 | Twitter 3차 포스트 (창업자 스토리) |
| 오후 9:00 | 12:00 | LinkedIn 포스트 |
| 오후 11:00 | 14:00 | Day 2 총정리 |

---

## r/digitalnomad 포스트

### 타이밍
- **최적 시간**: 오전 11:00 KST = 오후 6:00 PST (전날)
- **이유**: 미국 서부 저녁 시간 (r/digitalnomad 메인 사용자)

### 포스트 제목
```
Tired of opening bank accounts in every country? Built a 'Universal Identity' that works everywhere (2-sec passport verification + wallet)
```

### 포스트 본문
> `marketing/REDDIT_LAUNCH_POSTS.md`의 r/digitalnomad 버전 사용

---

## r/expats 포스트

### 타이밍
- **최적 시간**: 오후 3:00 KST = 6:00 AM UTC = 오후 2:00 유럽
- **이유**: 유럽 expat들의 오후 활동 시간

### 포스트 제목
```
I built a 'Universal Passport' for expats - instant identity verification that actually works abroad
```

### 포스트 본문
> `marketing/REDDIT_LAUNCH_POSTS.md`의 r/expats 버전 사용

---

## Twitter 폭격 전략

### 포스트 1: 성과 공유 (오전 10:00)
```
🔥 Day 1 Results:

Product Hunt: #X (Y upvotes!)
Reddit r/korea: Z upvotes
New signups: N

Thank you to everyone who supported us! 🙏

Day 2: Going global with r/expats and r/digitalnomad

Follow for updates!

#StartupLife #ProductLaunch
```

### 포스트 2: 데모 영상 (오후 2:00)
```
See K-Universal in action:

🛂 Passport scan → 2 seconds
💳 Wallet activation → 1 click
🚕 Book taxi → No Korean phone

[60초 영상 첨부]

Try free: fieldnine.io
```

### 포스트 3: 사용자 반응 (오후 6:00)
```
"Finally! I've been waiting for something like this for years" - Reddit user

"This would have saved me 3 weeks when I moved to Seoul" - Product Hunt comment

Real problems. Real solutions.

K-Universal: fieldnine.io
```

---

## Day 2 성과 목표

| 지표 | 최소 | 목표 | 홈런 |
|------|------|------|------|
| r/digitalnomad Upvotes | 500 | 2,000 | 5,000+ |
| r/expats Upvotes | 200 | 1,000 | 2,000+ |
| Twitter Impressions | 5,000 | 20,000 | 50,000+ |
| **Day 2 가입자** | 2,000 | 5,000 | 10,000+ |
| **누적 가입자** | 3,000 | 8,000 | 15,000+ |

---

# Day 3: 총정리 + 2차 공략 + 후속 조치

## 타임라인 (KST 기준)

| 시간 (KST) | 활동 |
|------------|------|
| 오전 9:00 | 전체 성과 정리 + 보고서 작성 |
| 오전 10:00 | 미응답 댓글 전부 응답 |
| 오전 11:00 | 감사 포스트 (Twitter, Reddit) |
| 오후 1:00 | r/Seoul 포스트 (2차 공략) |
| 오후 3:00 | r/fintech 포스트 (2차 공략) |
| 오후 5:00 | Product Hunt 우승 시 감사 포스트 |
| 오후 7:00 | 블로그 포스트: "We launched on PH" |
| 오후 9:00 | 이메일: 얼리 서포터에게 감사 |
| 오후 11:00 | Week 1 계획 수립 |

---

## 2차 공략 서브레딧

### r/Seoul (오후 1:00)
```
Title: Made this for fellow Seoul expats - instant passport verification + Ghost Wallet

[r/korea 버전 축약]
```

### r/fintech (오후 3:00)
```
Title: [Show r/fintech] Built a passport OCR + non-custodial wallet for 50M global citizens

[기술 중심 버전]
```

---

## 감사 포스트

### Twitter
```
🙏 THANK YOU!

Day 1-3 Results:
- Product Hunt: #X (Y upvotes)
- Reddit: Z total upvotes
- New users: N

To everyone who signed up, upvoted, commented, and shared - you made this happen.

This is just the beginning. 🚀

K-Universal: The future of identity for global citizens.
```

### Reddit (r/korea 원글에 업데이트)
```
**UPDATE:**

Wow! This blew up more than I expected.

Day 3 stats:
- X signups from r/korea alone
- Y comments (answered all of them!)
- Z feature requests logged

Thank you so much for the support and feedback.

**What's next:**
1. [Top requested feature 1] - Coming next week
2. [Top requested feature 2] - In progress
3. [Top requested feature 3] - On roadmap

Keep the feedback coming! 🙏
```

---

## 성과 보고서 템플릿

```markdown
# K-Universal 3-Day Launch Report

## Executive Summary
- **Total Signups**: X
- **Product Hunt Rank**: #Y
- **Total Reddit Upvotes**: Z
- **Conversion Rate**: A%

## Channel Breakdown

| Channel | Impressions | Clicks | Signups | Conv. Rate |
|---------|-------------|--------|---------|------------|
| Product Hunt | | | | |
| r/korea | | | | |
| r/expats | | | | |
| r/digitalnomad | | | | |
| Twitter | | | | |
| LinkedIn | | | | |
| **Total** | | | | |

## Top Feedback Themes
1. [Theme 1] - X mentions
2. [Theme 2] - Y mentions
3. [Theme 3] - Z mentions

## Action Items
- [ ] [High Priority] ...
- [ ] [Medium Priority] ...
- [ ] [Low Priority] ...

## Lessons Learned
1. ...
2. ...
3. ...
```

---

## Day 3 성과 목표

| 지표 | 최소 | 목표 | 홈런 |
|------|------|------|------|
| 2차 공략 Upvotes | 200 | 500 | 1,000+ |
| 미응답 댓글 처리 | 100% | 100% | 100% |
| **Day 3 가입자** | 500 | 2,000 | 3,000+ |
| **총 3일 가입자** | 5,000 | 10,000 | 20,000+ |

---

# 필요한 자산 총정리

## 필수 (D-0 완료)

| # | 자산 | 상태 | 담당 |
|---|------|------|------|
| 1 | Product Hunt 계정 | [ ] | |
| 2 | Reddit 계정 (7일+) | [ ] | |
| 3 | Twitter/X 계정 | [ ] | |
| 4 | 스크린샷 5장 | [ ] | |
| 5 | 60초 데모 영상 | [ ] | |
| 6 | 얼리 서포터 10명 | [ ] | |
| 7 | Founder 댓글 작성 | [x] | 완료 |
| 8 | Reddit 포스트 3개 | [x] | 완료 |
| 9 | Twitter 포스트 시리즈 | [x] | 완료 |

## 권장 (있으면 좋음)

| # | 자산 | 상태 | 효과 |
|---|------|------|------|
| 1 | LinkedIn 회사 페이지 | [ ] | B2B 신뢰도 |
| 2 | 프레스 키트 | [x] | 미디어 노출 |
| 3 | FAQ 페이지 | [ ] | 지원 부담 감소 |
| 4 | 로드맵 페이지 | [ ] | 사용자 기대 관리 |

---

# 응급 상황 대응

## 서버 다운 시
```bash
# 1. 상태 확인
curl https://www.fieldnine.io/api/health

# 2. Cloudflare 터널 확인
cloudflared tunnel list

# 3. 서버 재시작
cd C:\Users\polor\field-nine-solutions
npm run build && npm start

# 4. 터널 재연결
cloudflared tunnel run k-universal
```

## 부정적 댓글 대응
```
템플릿:

"Thanks for the feedback! You raise a valid concern about [issue].

Here's how we're addressing it:
1. [Solution/explanation]
2. [Future plan]

Would love to hear more specific concerns - feel free to DM me!"
```

## 버그 발견 시
```
1. 심각도 평가 (1-5)
2. 심각도 5: 즉시 핫픽스
3. 심각도 4: 24시간 내 수정
4. 심각도 1-3: 다음 스프린트

사용자 커뮤니케이션:
"Thanks for catching this! We're aware and working on a fix.
Will update here when resolved. 🙏"
```

---

# 체크리스트 요약

## D-0 (오늘)
- [ ] Product Hunt 계정 생성 + 프로필 완성
- [ ] Reddit 계정 확인 (7일+, 카르마 10+)
- [ ] Twitter 계정 설정
- [ ] 스크린샷 5장 촬영
- [ ] 60초 데모 영상 제작 + YouTube 업로드
- [ ] 얼리 서포터 10명 확보 + 연락처 정리
- [ ] 서버 상태 최종 점검
- [ ] War Room 모니터링 테스트

## Day 1
- [ ] 오후 5:00 - Product Hunt 제출
- [ ] 오후 5:05 - Founder 댓글 작성
- [ ] 오후 5:10 - 얼리 서포터에게 링크 전송
- [ ] 오후 5:30 - Twitter 런칭 포스트
- [ ] 오후 9:00 - r/korea 포스트
- [ ] 밤새 - 모든 댓글 응답 (5분 이내)

## Day 2
- [ ] 오전 10:00 - Twitter 성과 공유
- [ ] 오전 11:00 - r/digitalnomad 포스트
- [ ] 오후 3:00 - r/expats 포스트
- [ ] 오후 6:00 - Twitter 창업자 스토리
- [ ] 하루종일 - 모든 댓글 응답

## Day 3
- [ ] 오전 9:00 - 전체 성과 정리
- [ ] 오전 10:00 - 미응답 댓글 처리
- [ ] 오전 11:00 - 감사 포스트
- [ ] 오후 1:00 - r/Seoul 2차 공략
- [ ] 오후 3:00 - r/fintech 2차 공략
- [ ] 오후 7:00 - 블로그 포스트
- [ ] 오후 11:00 - Week 1 계획 수립

---

**작성일**: 2026-01-18
**상태**: Ready for Execution
**예상 결과**: 10,000+ 가입자, Product Hunt #1

---

> **"We're not just launching a product. We're launching a movement for the 50 million people who refuse to be limited by borders."**

🚀 **LET'S GO!**
