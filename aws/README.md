# AWS 서버리스 아키텍처 설정 가이드

## 1. DynamoDB 테이블 생성

```bash
aws dynamodb create-table \
  --table-name Users \
  --attribute-definitions AttributeName=userId,AttributeType=S AttributeName=email,AttributeType=S \
  --key-schema AttributeName=userId,KeyType=HASH \
  --global-secondary-indexes IndexName=email-index,KeySchema=[{AttributeName=email,KeyType=HASH}],Projection={ProjectionType=ALL},ProvisionedThroughput={ReadCapacityUnits=5,WriteCapacityUnits=5} \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  --region ap-northeast-2
```

## 2. Lambda 함수 배포

### 쇼핑 추천 함수
```bash
cd aws/lambda/shopping-recommendation
zip -r function.zip index.js node_modules/
aws lambda create-function \
  --function-name shopping-recommendation \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --environment Variables="{OPENAI_API_KEY=your_key,DYNAMODB_TABLE_NAME=Users}" \
  --region ap-northeast-2
```

### 데일리 일정 함수
```bash
cd aws/lambda/daily-schedule
zip -r function.zip index.js node_modules/
aws lambda create-function \
  --function-name daily-schedule \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --environment Variables="{OPENAI_API_KEY=your_key,DYNAMODB_TABLE_NAME=Users}" \
  --region ap-northeast-2
```

### Stripe 웹훅 함수
```bash
cd aws/lambda/stripe-webhook
npm install stripe
zip -r function.zip index.js node_modules/
aws lambda create-function \
  --function-name stripe-webhook \
  --runtime nodejs18.x \
  --role arn:aws:iam::ACCOUNT_ID:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://function.zip \
  --environment Variables="{STRIPE_SECRET_KEY=your_key,STRIPE_WEBHOOK_SECRET=your_secret,DYNAMODB_TABLE_NAME=Users}" \
  --region ap-northeast-2
```

## 3. API Gateway 설정

1. AWS 콘솔 > API Gateway > REST API 생성
2. 리소스 생성: `/recommend`, `/schedule`, `/webhook/stripe`
3. 각 리소스에 Lambda 통합 설정
4. CORS 활성화
5. API 배포

## 4. AWS Cognito 설정

1. AWS 콘솔 > Cognito > 사용자 풀 생성
2. 앱 클라이언트 생성
3. 환경 변수에 Cognito 정보 추가

## 5. 환경 변수 설정

### Lambda 환경 변수
- `OPENAI_API_KEY`: OpenAI API 키
- `DYNAMODB_TABLE_NAME`: Users
- `STRIPE_SECRET_KEY`: Stripe Secret Key
- `STRIPE_WEBHOOK_SECRET`: Stripe Webhook Secret

### Next.js 환경 변수 (.env.local)
```env
NEXT_PUBLIC_API_GATEWAY_URL=https://your-api-id.execute-api.ap-northeast-2.amazonaws.com/prod
NEXT_PUBLIC_COGNITO_USER_POOL_ID=your-pool-id
NEXT_PUBLIC_COGNITO_CLIENT_ID=your-client-id
AWS_REGION=ap-northeast-2
```

## 6. AWS Amplify 배포

1. GitHub 저장소 연결
2. 빌드 설정: `aws/amplify.yml` 사용
3. 환경 변수 설정
4. 자동 배포 활성화

## 7. 테스트

```bash
# API 테스트
curl -X POST https://your-api-id.execute-api.ap-northeast-2.amazonaws.com/prod/recommend \
  -H "Content-Type: application/json" \
  -d '{"userId":"test-user","query":"운동화 추천"}'
```

## 비용 예상

- Lambda: 월 100만 요청 = 약 $0.20
- DynamoDB: 월 100만 읽기/쓰기 = 약 $0.25
- API Gateway: 월 100만 요청 = 약 $3.50
- Amplify: 무료 티어 (월 1000 빌드 분)

**총 예상 비용: 월 $4-5 (소규모 트래픽 기준)**
