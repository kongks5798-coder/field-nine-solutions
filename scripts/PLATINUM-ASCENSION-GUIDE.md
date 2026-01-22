# 👑 PLATINUM ASCENSION GUIDE
## Field Nine Empire - 100% Real-World Sovereignty

---

## STEP 1: API 키 발급

### 1.1 KPX_API_KEY (한국전력거래소 SMP)
1. https://www.data.go.kr 접속
2. 회원가입/로그인
3. "전력거래소_시간별 SMP" 검색
4. API 활용신청 → 승인 (즉시~1일)
5. 마이페이지 → 발급된 인증키 복사

### 1.2 TESLA_ACCESS_TOKEN (Tesla Fleet API)
1. https://developer.tesla.com 접속
2. Tesla 계정으로 로그인
3. Developer Portal → Create Application
4. Fleet API 권한 선택 → 승인
5. Access Token 발급 → 복사

### 1.3 ALCHEMY_API_KEY (On-chain TVL)
1. https://dashboard.alchemy.com 접속
2. 회원가입/로그인
3. Create App → Ethereum Mainnet 선택
4. API Key 복사

---

## STEP 2: Vercel 환경변수 주입

### 방법 A: PowerShell 스크립트 (추천)

```powershell
# 1. 스크립트 파일 열기
notepad C:\Users\polor\field-nine-solutions\scripts\inject-platinum-keys.ps1

# 2. 아래 변수에 발급받은 키 입력
$KPX_API_KEY = "여기에_KPX_키_입력"
$TESLA_ACCESS_TOKEN = "여기에_테슬라_토큰_입력"
$ALCHEMY_API_KEY = "여기에_알케미_키_입력"

# 3. 저장 후 실행
cd C:\Users\polor\field-nine-solutions
.\scripts\inject-platinum-keys.ps1

# 4. 재배포
vercel --prod
```

### 방법 B: 수동 CLI 입력

```powershell
# KPX API Key
echo "YOUR_KPX_KEY" | vercel env add KPX_API_KEY production --yes

# Tesla Access Token
echo "YOUR_TESLA_TOKEN" | vercel env add TESLA_ACCESS_TOKEN production --yes

# Alchemy API Key
echo "YOUR_ALCHEMY_KEY" | vercel env add ALCHEMY_API_KEY production --yes

# Platinum Mode 활성화
echo "true" | vercel env add PLATINUM_MODE production --yes

# 재배포
vercel --prod
```

### 방법 C: Vercel 대시보드

1. https://vercel.com/kaus2025/field-nine-solutions/settings/environment-variables
2. 각 키 추가:
   - `KPX_API_KEY` = [발급받은 키]
   - `TESLA_ACCESS_TOKEN` = [발급받은 토큰]
   - `ALCHEMY_API_KEY` = [발급받은 키]
   - `PLATINUM_MODE` = true
3. Deployments → Redeploy

---

## STEP 3: DNS 설정 (Cloudflare)

1. Cloudflare 대시보드 → fieldnine.io 선택
2. DNS → Add Record:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | m | cname.vercel-dns.com | DNS only |
| CNAME | nexus | cname.vercel-dns.com | DNS only |

3. 저장 후 5분 대기
4. 확인: https://m.fieldnine.io

---

## STEP 4: PLATINUM 검증

```powershell
# 1. API 키 검증
curl https://www.fieldnine.io/api/platinum-check

# 2. DNS 모니터링
curl https://www.fieldnine.io/api/dns-monitor

# 3. 수익 리포트 확인
curl https://www.fieldnine.io/api/verified-revenue

# 4. Platinum Certificate 발급
curl https://www.fieldnine.io/api/platinum-certificate
```

---

## 예상 결과

키 주입 완료 후:

```json
{
  "grade": "PLATINUM",
  "livePercentage": 100,
  "certificate": {
    "issued": true,
    "certificateId": "FN-PLA-XXXXX-XXXX",
    "grade": "PLATINUM"
  }
}
```

---

## 문제 해결

### Q: 키 주입 후에도 BRONZE?
A: `vercel --prod` 재배포 필요

### Q: DNS가 PENDING?
A: Cloudflare에서 Proxy 끄고 DNS only로 설정

### Q: Tesla API 401 에러?
A: Access Token 만료 → 재발급 필요

---

**Contact:** Phase 31 완료 후 `/api/sovereignty` 에서 PLATINUM 확인
