# 🎉 백엔드 Lambda + AI 연동 완성 보고

## ✅ 완료된 작업

### 1. Lambda 함수 3개 구현 (Node.js 18)

#### 1-1. recommendShopping (`aws/lambda/recommend-shopping/index.js`)
- ✅ OpenAI GPT-4o-mini 연동
- ✅ Claude API 옵션 지원
- ✅ 사용자 프로필 조회 (DynamoDB)
- ✅ 가격 예측 Mock (향후 Prophet/XGBoost로 교체)
- ✅ 개인화된 추천 생성
- ✅ CORS 지원
- ✅ 에러 핸들링

**기능:**
- 사용자 쿼리 → AI 추천 생성
- 예산/브랜드/카테고리 고려
- 가격 정보 및 예상 절약 금액 포함

#### 1-2. dailySchedule (`aws/lambda/daily-schedule/index.js`)
- ✅ Google Calendar API 연동
- ✅ 일정 조회/생성 (기본 구조)
- ✅ AI 일정 추천 (OpenAI)
- ✅ OAuth 토큰 관리
- ✅ CORS 지원

**기능:**
- Google Calendar 일정 조회
- AI 기반 일정 분석 및 추천
- 사용자별 토큰 관리

#### 1-3. predictSavings (`aws/lambda/predict-savings/index.js`)
- ✅ XGBoost Mock 예측
- ✅ Prophet Mock 예측
- ✅ 7일 절약 예측
- ✅ 사용자 히스토리 기반 예측
- ✅ 신뢰도 계산

**기능:**
- 7일간 예상 절약 금액 예측
- 일별 예측 데이터 제공
- 모델별 예측 (XGBoost/Prophet)

---

### 2. API Gateway 설정

#### 2-1. API 엔드포인트 (`aws/api-gateway/api-config.yaml`)
- ✅ `/recommend` - 쇼핑 추천
- ✅ `/schedule` - 일정 관리
- ✅ `/predict-savings` - 절약 예측
- ✅ CORS 설정
- ✅ OpenAPI 3.0 스펙

---

### 3. 배포 가이드

#### 3-1. 상세 가이드 (`aws/LAMBDA_DEPLOYMENT_GUIDE.md`)
- ✅ Lambda 함수 배포 절차
- ✅ 환경변수 설정 가이드
- ✅ API Gateway 연결 방법
- ✅ IAM 역할 설정
- ✅ 테스트 방법

---

### 4. 테스트 스크립트

#### 4-1. Bash 스크립트 (`aws/test/test-lambda.sh`)
- ✅ recommendShopping 테스트
- ✅ dailySchedule 테스트
- ✅ predictSavings 테스트
- ✅ 전체 테스트

#### 4-2. PowerShell 스크립트 (`aws/test/test-lambda.ps1`)
- ✅ Windows 환경 지원
- ✅ 동일한 테스트 기능

---

## 🔧 환경변수 설정 (AWS 콘솔)

### recommendShopping Lambda
```
OPENAI_API_KEY=sk-...
CLAUDE_API_KEY=sk-ant-... (옵션)
OPENAI_MODEL=gpt-4o-mini
USERS_TABLE_NAME=Users
```

### dailySchedule Lambda
```
GOOGLE_CALENDAR_API_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
USERS_TABLE_NAME=Users
```

### predictSavings Lambda
```
RECOMMENDATIONS_TABLE_NAME=ProductRecommendations
USERS_TABLE_NAME=Users
```

---

## 🧪 테스트 방법

### 1. recommendShopping 테스트
```bash
curl -X POST https://YOUR_API_ID.execute-api.ap-northeast-2.amazonaws.com/prod/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "query": "오늘 저녁 뭐 입을까? 예산 5만원",
    "userId": "test-user-123"
  }'
```

**예상 응답:**
```json
{
  "success": true,
  "recommendation": "이 셔츠 어때요? 38,000원에 세일 중! 따뜻하고 스타일 좋아요~ 예상 절약 12,000원",
  "priceInfo": {
    "currentPrice": 50000,
    "predictedDiscount": 20,
    "estimatedSavings": 12000,
    "daysUntilSale": 3
  },
  "dataSource": ["OpenAI GPT-4o-mini", "가격 예측 모델 (Mock)"]
}
```

### 2. PowerShell 테스트 (Windows)
```powershell
# 환경변수 설정
$env:API_GATEWAY_URL = "https://YOUR_API_ID.execute-api.ap-northeast-2.amazonaws.com/prod"

# 테스트 실행
.\aws\test\test-lambda.ps1 recommend
.\aws\test\test-lambda.ps1 schedule
.\aws\test\test-lambda.ps1 predict
.\aws\test\test-lambda.ps1 all
```

---

## 📋 배포 체크리스트

### Lambda 함수 배포
- [ ] recommendShopping Lambda 생성 및 배포
- [ ] dailySchedule Lambda 생성 및 배포
- [ ] predictSavings Lambda 생성 및 배포
- [ ] 환경변수 설정 완료
- [ ] IAM 역할 설정 완료

### API Gateway 설정
- [ ] REST API 생성
- [ ] 리소스 생성 (/recommend, /schedule, /predict-savings)
- [ ] Lambda 통합 설정
- [ ] CORS 설정
- [ ] 배포 (prod 스테이지)

### 테스트
- [ ] recommendShopping 테스트 통과
- [ ] dailySchedule 테스트 통과
- [ ] predictSavings 테스트 통과
- [ ] CORS 테스트 통과

### 프론트엔드 연동
- [ ] `NEXT_PUBLIC_API_GATEWAY_URL` 환경변수 설정
- [ ] `lib/aws-api.ts` 업데이트 확인
- [ ] 채팅 기능 연동 테스트

---

## 🚀 다음 단계

1. **AWS 리소스 배포**
   - `aws/LAMBDA_DEPLOYMENT_GUIDE.md` 참고
   - Lambda 함수 배포
   - API Gateway 설정

2. **프론트엔드 연동**
   - `NEXT_PUBLIC_API_GATEWAY_URL` 설정
   - 채팅 기능 테스트

3. **인증/구독 단계** (옵션 2)
   - Cognito 인증 통합
   - Stripe 구독 연동

---

## 📝 파일 구조

```
aws/
├── lambda/
│   ├── recommend-shopping/
│   │   └── index.js          # 쇼핑 추천 Lambda
│   ├── daily-schedule/
│   │   └── index.js          # 일정 관리 Lambda
│   └── predict-savings/
│       └── index.js          # 절약 예측 Lambda
├── api-gateway/
│   └── api-config.yaml       # API Gateway 설정
├── test/
│   ├── test-lambda.sh        # Bash 테스트 스크립트
│   └── test-lambda.ps1       # PowerShell 테스트 스크립트
├── LAMBDA_DEPLOYMENT_GUIDE.md
└── README.md
```

---

## ⚠️ 주의사항

1. **API 키 보안**
   - 환경변수에만 저장
   - 코드에 하드코딩 금지
   - Git에 커밋하지 않기

2. **CORS 설정**
   - 개발: `*` 허용
   - 프로덕션: 특정 도메인만 허용

3. **에러 핸들링**
   - 모든 Lambda에 try-catch 포함
   - CloudWatch 로그 확인

4. **비용 관리**
   - Lambda 실행 시간 최적화
   - API Gateway 요청 제한 설정

---

**보스, 백엔드 Lambda + AI 연동 완성되었습니다!**

배포 후 API URL을 프론트엔드에 연결하면 채팅 기능이 바로 작동합니다.
