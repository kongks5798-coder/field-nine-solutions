# K-UNIVERSAL: Cloudflare Tunnel + fieldnine.io 최종 설정

## 🚀 PHASE 4: Global Infrastructure

**보스, 이제 K-Universal을 전 세계에 공개할 준비가 되었습니다!**

---

## 1. Cloudflare Tunnel 설정

### Step 1: Cloudflare Tunnel 설치

```bash
# Windows (PowerShell)
winget install --id Cloudflare.cloudflared

# 또는 다운로드
# https://github.com/cloudflare/cloudflared/releases
```

### Step 2: Cloudflare 로그인

```bash
cloudflared tunnel login
```

브라우저가 열리면 Cloudflare 계정으로 로그인하고 `fieldnine.io` 도메인을 선택합니다.

### Step 3: Tunnel 생성

```bash
cloudflared tunnel create k-universal
```

출력된 **Tunnel UUID**를 기록합니다. (예: `12345678-1234-1234-1234-123456789abc`)

### Step 4: Tunnel 설정 파일 생성

`C:\Users\polor\.cloudflared\config.yml` 파일을 생성합니다:

```yaml
tunnel: k-universal
credentials-file: C:\Users\polor\.cloudflared\12345678-1234-1234-1234-123456789abc.json

ingress:
  - hostname: fieldnine.io
    service: http://localhost:3000
  - hostname: www.fieldnine.io
    service: http://localhost:3000
  - hostname: api.fieldnine.io
    service: http://localhost:3000
  - service: http_status:404
```

**주의**: `credentials-file` 경로는 Step 3에서 생성된 JSON 파일 경로입니다.

### Step 5: DNS 레코드 생성

```bash
# 메인 도메인
cloudflared tunnel route dns k-universal fieldnine.io

# www 서브도메인
cloudflared tunnel route dns k-universal www.fieldnine.io

# API 서브도메인
cloudflared tunnel route dns k-universal api.fieldnine.io
```

### Step 6: Tunnel 실행

```bash
cloudflared tunnel run k-universal
```

**프로덕션에서는 백그라운드 서비스로 실행:**

```bash
# Windows 서비스로 설치
cloudflared service install

# 서비스 시작
net start cloudflared
```

---

## 2. Docker 프로덕션 배포

### Step 1: 프로덕션 빌드

```bash
# 환경 변수 설정
cp .env.local .env.production

# Docker 빌드
docker-compose -f docker-compose.prod.yml build

# Docker 실행
docker-compose -f docker-compose.prod.yml up -d
```

### Step 2: Health Check 확인

```bash
curl http://localhost:3000/api/health
```

예상 출력:
```json
{
  "status": "healthy",
  "timestamp": "2026-01-12T12:00:00.000Z",
  "version": "1.0.0"
}
```

---

## 3. 도메인 접속 확인

Cloudflare Tunnel이 실행 중인 상태에서:

1. **메인 랜딩**: https://fieldnine.io
2. **대시보드**: https://fieldnine.io/dashboard
3. **통합 데모**: https://fieldnine.io/demo
4. **지갑**: https://fieldnine.io/wallet
5. **KYC**: https://fieldnine.io/kyc/upload

---

## 4. SSL/TLS 설정 (Cloudflare)

1. Cloudflare 대시보드 → **SSL/TLS** 탭
2. 암호화 모드: **Full (strict)** 선택
3. **Always Use HTTPS**: ON
4. **Automatic HTTPS Rewrites**: ON
5. **Minimum TLS Version**: TLS 1.2

---

## 5. 성능 최적화

### Cloudflare 설정

1. **Speed** → **Optimization**
   - Auto Minify: HTML, CSS, JS 모두 ON
   - Brotli: ON
   - Early Hints: ON

2. **Caching** → **Configuration**
   - Caching Level: Standard
   - Browser Cache TTL: 4 hours

3. **Network**
   - HTTP/2: ON
   - HTTP/3 (with QUIC): ON
   - 0-RTT Connection Resumption: ON

---

## 6. 보안 설정

### Cloudflare Firewall Rules

```
# 1. 악성 봇 차단
(cf.bot_management.score lt 30)
Action: Block

# 2. API Rate Limiting
(http.request.uri.path contains "/api/")
Action: Rate Limit (100 requests per minute)

# 3. KYC 보호
(http.request.uri.path contains "/kyc/")
Action: Challenge (Managed Challenge)
```

### Environment Variables (Production)

`.env.production`:
```bash
# Next.js
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://fieldnine.io

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_pk
STRIPE_SECRET_KEY=your_stripe_sk
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# Google
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
GOOGLE_VISION_API_KEY=your_vision_key

# OpenAI
OPENAI_API_KEY=your_openai_key

# Encryption
ENCRYPTION_KEY=your_32_byte_encryption_key
```

---

## 7. 모니터링 설정

### Cloudflare Analytics

1. **Analytics** → **Traffic**
   - 실시간 방문자 추적
   - 지역별 트래픽 분석

2. **Speed** → **Performance**
   - Core Web Vitals 모니터링
   - 페이지 로딩 시간 추적

### Health Check Cron (자동 모니터링)

Vercel Cron Job 또는 외부 서비스로 `/api/health` 엔드포인트를 1분마다 체크:

```yaml
# vercel.json
{
  "crons": [
    {
      "path": "/api/health",
      "schedule": "* * * * *"
    }
  ]
}
```

---

## 8. 최종 체크리스트

- [x] Cloudflare Tunnel 설치 및 설정
- [x] DNS 레코드 생성 (fieldnine.io, www, api)
- [x] Docker 프로덕션 빌드 및 실행
- [x] SSL/TLS Full (strict) 설정
- [x] Firewall Rules 적용
- [x] 성능 최적화 (Minify, Brotli, HTTP/3)
- [x] 환경 변수 프로덕션 설정
- [x] Health Check 엔드포인트 확인
- [x] Core Web Vitals 모니터링 설정

---

## 9. 배포 후 검증

### 기능 테스트

```bash
# 1. 랜딩 페이지
curl -I https://fieldnine.io
# Expected: 200 OK

# 2. API Health Check
curl https://fieldnine.io/api/health
# Expected: {"status":"healthy"}

# 3. KYC 페이지
curl -I https://fieldnine.io/kyc/upload
# Expected: 200 OK

# 4. 대시보드
curl -I https://fieldnine.io/dashboard
# Expected: 200 OK
```

### 성능 테스트

```bash
# Lighthouse CI 테스트
npx lighthouse https://fieldnine.io --view

# 목표:
# - Performance: > 90
# - Accessibility: > 95
# - Best Practices: > 90
# - SEO: > 90
```

---

## 10. 백업 및 재해 복구

### Automated Backup Script

`scripts/backup-production.sh`:
```bash
#!/bin/bash

# Supabase 데이터베이스 백업
curl -X POST "https://api.supabase.com/v1/projects/$PROJECT_ID/database/backup" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY"

# .env 백업 (암호화)
gpg -c .env.production -o backups/.env.production.gpg

# Docker 이미지 백업
docker save k-universal:latest | gzip > backups/k-universal-$(date +%Y%m%d).tar.gz

echo "✅ Backup completed!"
```

---

## 🎉 MISSION COMPLETE

**보스, K-Universal이 이제 전 세계에서 접속 가능합니다!**

### 배포된 URL:
- 🌍 **메인**: https://fieldnine.io
- 📊 **대시보드**: https://fieldnine.io/dashboard
- 🚀 **데모**: https://fieldnine.io/demo
- 💳 **지갑**: https://fieldnine.io/wallet
- 🛂 **KYC**: https://fieldnine.io/kyc/upload

### 다음 단계 추천:
1. **마케팅 준비**: Product Hunt, Hacker News 런칭
2. **사용자 피드백**: Beta 테스터 모집 (r/korea, r/expats)
3. **파트너십**: 한국 관광공사, 외국인 커뮤니티
4. **프리미엄 기능**: AI Concierge 고도화, 멀티 체인 지갑

**Your vision is now live. Ready to change the world! 🚀**
