# 🔑 K-UNIVERSAL PHASE 2 API Keys Setup Guide

**보스, 금융 인프라 완성을 위한 API 키 설정 가이드입니다.**

---

## 📋 필수 API 키 목록

### 1. Stripe (결제 처리) ⚡
**용도**: Ghost Wallet 충전, 카드 결제 처리

**발급 방법**:
1. [Stripe Dashboard](https://dashboard.stripe.com) 접속
2. 계정 생성 (무료)
3. **Developers → API keys** 메뉴
4. 다음 키 복사:
   - **Publishable key**: `pk_test_...` (클라이언트용)
   - **Secret key**: `sk_test_...` (서버용)

**환경 변수 설정**:
```bash
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**비용**: 
- 테스트 환경: 무료
- 프로덕션: 거래당 2.9% + $0.30

---

### 2. Google Vision API (고정밀 OCR) 👁️
**용도**: 여권 MRZ 추출 (Tesseract.js 보조)

**발급 방법**:
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 프로젝트 생성
3. **APIs & Services → Library** 메뉴
4. "Cloud Vision API" 검색 후 **Enable**
5. **Credentials → Create Credentials → API Key**

**환경 변수 설정**:
```bash
GOOGLE_VISION_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**비용**:
- 첫 1,000건/월: 무료
- 이후: $1.50 / 1,000건

**대안 (무료)**:
- Tesseract.js만 사용 (클라이언트 OCR)
- Google Vision API는 선택 사항 (정확도 향상용)

---

### 3. Supabase (데이터베이스) 🗄️
**용도**: 유저 프로필, KYC 데이터, Ghost Wallet 정보

**발급 방법**:
1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 생성 (무료 티어 사용 가능)
3. **Settings → API** 메뉴
4. 다음 값 복사:
   - **Project URL**: `https://xxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (선택)

**환경 변수 설정**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNTIyMTM0NywiZXhwIjoxOTMwNzk3MzQ3fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHgiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE1MjIxMzQ3LCJleHAiOjE5MzA3OTczNDd9.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**비용**: 무료 (500MB DB, 1GB 파일 스토리지)

---

### 4. Card Encryption Key (보안) 🔒
**용도**: 가상 카드 정보 암호화

**생성 방법**:
```bash
# 랜덤 키 생성 (32자)
openssl rand -base64 32
```

**환경 변수 설정**:
```bash
CARD_ENCRYPTION_KEY=your-secure-random-key-here-32-chars
```

**프로덕션 권장**:
- AWS KMS (Key Management Service)
- HashiCorp Vault
- Google Cloud KMS

---

## 🚀 환경 변수 설정 (.env.local)

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 복사하세요:

```bash
# ===================================
# K-UNIVERSAL Phase 2 Environment Variables
# ===================================

# ----- Stripe (결제) -----
STRIPE_SECRET_KEY=sk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ----- Google Vision API (OCR) -----
# 선택 사항: Tesseract.js만 사용 시 불필요
GOOGLE_VISION_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# ----- Supabase (데이터베이스) -----
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxxxxxxx
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxxxxxxx

# ----- Card Encryption (보안) -----
CARD_ENCRYPTION_KEY=your-secure-random-key-here-32-chars

# ----- Google Maps (대시보드) -----
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# ----- App Configuration -----
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## ⚡ 빠른 시작 (테스트 모드)

### 최소 설정으로 시작하기

**필수 API 키만으로 시작**:
```bash
# .env.local 최소 설정

# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxxxxxxxxxxx

# Stripe (테스트 키)
STRIPE_SECRET_KEY=sk_test_dummy
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_dummy

# Encryption Key (임시)
CARD_ENCRYPTION_KEY=temp-key-for-testing-only
```

**설정 후 실행**:
```bash
npm run dev
```

**테스트 페이지**:
- 지갑: http://localhost:3000/wallet
- KYC: http://localhost:3000/kyc/upload
- 대시보드: http://localhost:3000/dashboard

---

## 🔧 API 키 검증 체크리스트

### 1. Stripe 키 검증
```bash
# curl 명령어로 테스트
curl https://api.stripe.com/v1/balance \
  -u sk_test_51xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx:
```

**성공 응답**:
```json
{
  "object": "balance",
  "available": [...],
  "livemode": false
}
```

### 2. Supabase 키 검증
브라우저 콘솔에서:
```javascript
const { data, error } = await supabase.from('profiles').select('*').limit(1);
console.log(data, error);
```

### 3. Google Vision API 검증
```bash
curl -X POST \
  https://vision.googleapis.com/v1/images:annotate?key=YOUR_API_KEY \
  -H 'Content-Type: application/json' \
  -d '{"requests":[{"image":{"source":{"imageUri":"https://..."}},"features":[{"type":"TEXT_DETECTION"}]}]}'
```

---

## 💰 비용 추정 (월간)

### 스타트업 규모 (1,000명 사용자)
| 서비스 | 사용량 | 비용 |
|--------|--------|------|
| Supabase | 500MB DB + 1GB 파일 | **$0** (무료 티어) |
| Stripe | 100건 결제 x $5 평균 | **$14.50** (2.9% + $0.30) |
| Google Vision | 1,000건 OCR | **$0** (무료 한도) |
| **총계** | | **~$15/월** |

### 중규모 (10,000명 사용자)
| 서비스 | 사용량 | 비용 |
|--------|--------|------|
| Supabase | Pro 플랜 | **$25/월** |
| Stripe | 1,000건 결제 x $10 평균 | **$145/월** |
| Google Vision | 10,000건 OCR | **$13.50/월** |
| **총계** | | **~$184/월** |

---

## 🛡️ 보안 주의사항

### ❌ 절대 금지
```bash
# 잘못된 예: 퍼블릭 레포에 키 노출
git add .env.local
git commit -m "Add env"  # NEVER DO THIS!
```

### ✅ 올바른 방법
```bash
# .gitignore에 추가 (이미 설정됨)
.env.local
.env*.local
```

### 🔐 프로덕션 환경
- **Vercel**: Environment Variables 메뉴에서 설정
- **AWS**: Parameter Store / Secrets Manager
- **Docker**: `--env-file` 플래그 사용

---

## 🆘 문제 해결

### 1. "Stripe API key invalid"
```bash
# 키 앞뒤 공백 확인
STRIPE_SECRET_KEY=sk_test_51xxx...  # ✅ 올바름
STRIPE_SECRET_KEY= sk_test_51xxx... # ❌ 앞 공백
```

### 2. "Supabase connection failed"
- Dashboard에서 프로젝트 Paused 상태 확인
- NEXT_PUBLIC_ 접두사 확인 (클라이언트 사이드용)

### 3. "Google Vision quota exceeded"
- 무료 한도 (1,000건/월) 초과
- Tesseract.js만 사용하도록 전환

---

## 📞 지원 리소스

### Stripe
- [Stripe 문서](https://stripe.com/docs)
- [Stripe Discord](https://discord.gg/stripe)

### Google Cloud
- [Vision API 문서](https://cloud.google.com/vision/docs)
- [지원 센터](https://cloud.google.com/support)

### Supabase
- [Supabase 문서](https://supabase.com/docs)
- [Discord 커뮤니티](https://discord.supabase.com)

---

**보스, 이 가이드대로 API 키를 설정하면 즉시 Ghost Wallet을 테스트할 수 있습니다!** 🚀

최소 설정(Supabase만)으로도 대부분의 기능이 작동하므로, 나머지 키는 필요 시 추가하시면 됩니다.
