#!/bin/bash

# Lambda 함수 테스트 스크립트
# 사용법: ./test-lambda.sh [recommend|schedule|predict]

API_BASE_URL="${API_GATEWAY_URL:-https://YOUR_API_ID.execute-api.ap-northeast-2.amazonaws.com/prod}"

case "$1" in
  recommend)
    echo "🧪 Testing recommendShopping Lambda..."
    curl -X POST "${API_BASE_URL}/recommend" \
      -H "Content-Type: application/json" \
      -d '{
        "query": "오늘 저녁 뭐 입을까? 예산 5만원",
        "userId": "test-user-123"
      }' | jq .
    ;;
  
  schedule)
    echo "🧪 Testing dailySchedule Lambda..."
    curl -X POST "${API_BASE_URL}/schedule" \
      -H "Content-Type: application/json" \
      -d '{
        "userId": "test-user-123",
        "action": "get",
        "date": "'$(date +%Y-%m-%d)'"
      }' | jq .
    ;;
  
  predict)
    echo "🧪 Testing predictSavings Lambda..."
    curl -X POST "${API_BASE_URL}/predict-savings" \
      -H "Content-Type: application/json" \
      -d '{
        "userId": "test-user-123",
        "days": 7,
        "model": "xgboost"
      }' | jq .
    ;;
  
  all)
    echo "🧪 Testing all Lambda functions..."
    echo ""
    echo "1. recommendShopping:"
    ./test-lambda.sh recommend
    echo ""
    echo "2. dailySchedule:"
    ./test-lambda.sh schedule
    echo ""
    echo "3. predictSavings:"
    ./test-lambda.sh predict
    ;;
  
  *)
    echo "Usage: $0 [recommend|schedule|predict|all]"
    echo ""
    echo "Examples:"
    echo "  $0 recommend  # Test shopping recommendation"
    echo "  $0 schedule   # Test daily schedule"
    echo "  $0 predict    # Test savings prediction"
    echo "  $0 all        # Test all functions"
    exit 1
    ;;
esac
