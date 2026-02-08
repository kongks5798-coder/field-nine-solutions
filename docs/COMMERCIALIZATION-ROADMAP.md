# K-Universal 상용화 로드맵

## 현재 상태 (2026년 1월)
- Tesla 스타일 UI 완성
- 기본 인프라 구축 (Vercel, Supabase)
- 보안 시스템 구현 (AES-256 암호화, 입력 검증)
- 프로덕션 URL: https://www.fieldnine.io

---

## Phase 1: 핵심 API 연동 (2-3주)

### 1.1 호텔 - Stay22 API 연동
```
상태: 스키마 준비됨, 실제 연동 필요
```

**필요 작업:**
- [ ] Stay22 Affiliate 계정 생성 (https://www.stay22.com/affiliates)
- [ ] API Key 발급 및 환경변수 설정
- [ ] 실제 호텔 검색 API 연동
- [ ] 예약 딥링크 생성 로직 완성

**환경변수 추가:**
```env
STAY22_API_KEY=your_api_key
STAY22_AFFILIATE_ID=fieldnine
```

**수익 모델:** 예약당 커미션 3-8%

---

### 1.2 항공권 - Amadeus API 연동
```
상태: 클라이언트 코드 존재, 프로덕션 키 필요
```

**필요 작업:**
- [ ] Amadeus for Developers 계정 생성 (https://developers.amadeus.com)
- [ ] 프로덕션 API 키 신청 (테스트 → 프로덕션 승격)
- [ ] Flight Offers Search API 연동
- [ ] 가격 알림 기능 구현

**환경변수 추가:**
```env
AMADEUS_CLIENT_ID=your_client_id
AMADEUS_CLIENT_SECRET=your_client_secret
AMADEUS_ENV=production
```

**수익 모델:**
- Amadeus 직접 예약: 건당 수수료
- 메타서치 방식: 제휴 OTA 리디렉션 커미션

---

### 1.3 환율 - 실시간 API 연동
```
상태: 기본 환율 하드코딩됨, 실시간 API 필요
```

**추천 API (무료/저가):**
1. **한국수출입은행 API** (무료, 하루 1회)
   - https://www.koreaexim.go.kr/ir/HPHKIR020M01?apino=2
2. **ExchangeRate-API** (월 1,500회 무료)
   - https://www.exchangerate-api.com
3. **Open Exchange Rates** (월 1,000회 무료)
   - https://openexchangerates.org

**환경변수 추가:**
```env
EXCHANGE_RATE_API_KEY=your_api_key
```

---

## Phase 2: 결제 시스템 (2-3주)

### 2.1 해외 결제 - Stripe
```
상태: 웹훅 구현됨, 실제 연동 필요
```

**필요 작업:**
- [ ] Stripe 계정 생성 (https://stripe.com)
- [ ] 한국 사업자 인증 완료
- [ ] Checkout Session 구현
- [ ] 웹훅 시크릿 설정

**환경변수:**
```env
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

---

### 2.2 국내 결제 - 토스페이먼츠 또는 아임포트
```
추천: 토스페이먼츠 (개발자 친화적)
```

**지원 결제수단:**
- 카카오페이, 네이버페이, 토스페이
- 신용카드 (국내/해외)
- 계좌이체, 가상계좌

**필요 작업:**
- [ ] 토스페이먼츠 가맹점 등록
- [ ] 결제 위젯 연동
- [ ] 환불 API 구현

**환경변수:**
```env
TOSS_CLIENT_KEY=test_ck_xxx
TOSS_SECRET_KEY=test_sk_xxx
```

---

### 2.3 Ghost Wallet (자체 지갑)
```
상태: UI 구현됨, 백엔드 로직 필요
```

**필요 작업:**
- [ ] Supabase 잔액 테이블 생성
- [ ] 충전/사용/환불 트랜잭션 로직
- [ ] 잔액 부족 시 추가 결제 플로우

---

## Phase 3: 법적 요구사항 (1-2주)

### 3.1 사업자 등록
```
필수: 온라인 서비스업
```

**체크리스트:**
- [ ] 사업자등록증 발급
- [ ] 통신판매업 신고
- [ ] 전자상거래 사업자 정보 공개

---

### 3.2 여행업 등록 여부 검토
```
중요: 직접 예약 vs 메타서치 구분
```

**메타서치 모델 (현재 방식):**
- 여행업 등록 **불필요**
- 예약은 제휴사(Stay22, Booking.com 등)에서 처리
- K-Universal은 정보 제공 + 리디렉션만

**직접 예약 모델 (향후 확장 시):**
- 국내여행업 또는 일반여행업 등록 필요
- 보증보험 가입 필요 (3,000만원~)
- 관광진흥법 준수

---

### 3.3 개인정보 처리
```
필수: 개인정보처리방침 공개
```

**체크리스트:**
- [x] 개인정보처리방침 페이지 (/legal/privacy)
- [x] 이용약관 페이지 (/legal/terms)
- [ ] 개인정보 수집 동의 체크박스 (회원가입 시)
- [ ] PIPA(개인정보보호법) 준수 점검
- [ ] 해외 사용자 대상 시 GDPR 검토

---

### 3.4 필수 고지사항
```
전자상거래법 준수
```

**푸터에 표시해야 할 정보:**
```
상호: Field Nine Solutions
대표자: [대표자명]
사업자등록번호: [XXX-XX-XXXXX]
통신판매업신고번호: [XXXX-서울XX-XXXX]
주소: [사업장 주소]
이메일: support@fieldnine.io
전화: [고객센터 번호]
```

---

## Phase 4: 운영 인프라 (1-2주)

### 4.1 모니터링 설정
```
추천: Vercel Analytics + Sentry
```

**필요 작업:**
- [ ] Vercel Analytics 활성화 (무료)
- [ ] Sentry 에러 모니터링 연동
- [ ] Uptime 모니터링 (UptimeRobot 무료)

---

### 4.2 고객 지원 시스템
```
추천: Crisp 또는 Channel.io
```

**옵션:**
1. **Crisp** - 무료 플랜 있음, 라이브챗
2. **Channel.io** - 한국 서비스, 카카오 연동
3. **Zendesk** - 엔터프라이즈급

**필요 작업:**
- [ ] 챗봇/라이브챗 위젯 추가
- [ ] FAQ 페이지 작성
- [ ] 이메일 지원 설정 (support@fieldnine.io)

---

### 4.3 이메일 시스템
```
추천: Resend 또는 SendGrid
```

**발송 이메일 종류:**
- 회원가입 환영
- 예약 확인
- 환율 알림
- 비밀번호 재설정

**환경변수:**
```env
RESEND_API_KEY=re_xxx
EMAIL_FROM=noreply@fieldnine.io
```

---

## Phase 5: 마케팅 & 런칭 (지속)

### 5.1 SEO 최적화
```
상태: 기본 메타태그 있음, 강화 필요
```

**체크리스트:**
- [x] sitemap.xml 생성
- [x] robots.txt 설정
- [ ] 각 페이지 메타 디스크립션 최적화
- [ ] 구조화된 데이터 (Schema.org) 추가
- [ ] Google Search Console 등록
- [ ] Naver Search Advisor 등록

---

### 5.2 앱스토어 배포 (선택)
```
PWA로 기본 제공, 네이티브 앱은 선택
```

**옵션:**
1. **PWA** (현재) - 설치 가능, 푸시 알림
2. **Capacitor** - 웹 → 네이티브 래핑
3. **React Native** - 완전 네이티브 (리소스 많이 필요)

---

### 5.3 런칭 전략

**Soft Launch (1-2주):**
- 지인/테스터 대상 베타 테스트
- 버그 수집 및 수정
- 사용성 피드백 반영

**Public Launch:**
- Product Hunt 등록
- 네이버 카페/블로그 홍보
- SNS 마케팅 (인스타그램, 틱톡)

---

## Phase 6: 수익화 전략

### 6.1 커미션 수익 (메인)
```
호텔 예약: 3-8% 커미션
항공권: 건당 $2-10 또는 %
```

### 6.2 프리미엄 구독 (보조)
```
현재 가격 체계:
- Free: 기본 기능
- Pro: ₩9,900/월 - 환율 알림, 우선 지원
- Business: ₩29,900/월 - API 액세스, 팀 기능
```

### 6.3 광고 수익 (선택)
```
Google AdSense 또는 프리미엄 스폰서
주의: 과도한 광고는 UX 저해
```

---

## 예상 비용 (월간)

| 항목 | 비용 | 비고 |
|------|------|------|
| Vercel Pro | $20 | 현재 무료도 가능 |
| Supabase | $25 | Pro 플랜 |
| 도메인 | ~$1 | 연간 $12 |
| 이메일 (Resend) | $0-20 | 무료 티어 있음 |
| 모니터링 (Sentry) | $0-26 | 무료 티어 있음 |
| **총합** | **~$50-100/월** | 초기 단계 |

---

## 즉시 실행 가능한 액션 아이템

### 이번 주 할 일:
1. [ ] Stay22 Affiliate 가입 신청
2. [ ] Amadeus Developer 계정 생성
3. [ ] 토스페이먼츠 가맹점 신청
4. [ ] 사업자등록 준비 (필요시)

### 다음 주 할 일:
1. [ ] API 키 발급 후 실제 연동
2. [ ] 결제 테스트 환경 구축
3. [ ] 개인정보 동의 UI 추가
4. [ ] 고객지원 챗봇 연동

---

## 연락처 & 리소스

**API 문서:**
- Stay22: https://www.stay22.com/docs
- Amadeus: https://developers.amadeus.com/self-service
- 토스페이먼츠: https://docs.tosspayments.com

**법률 상담:**
- 관광사업 등록: 관할 구청 관광과
- 통신판매업: 공정거래위원회

---

*마지막 업데이트: 2026-01-20*
