# TrendStream Python Backend

로컬 GPU (5090)에서 실행되는 AI 분석 엔진

## 설치

```bash
# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt
```

## 실행

```bash
# 개발 모드
python main.py

# 또는 uvicorn 직접 실행
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

서버가 `http://localhost:8000`에서 실행됩니다.

## API 엔드포인트

### 헬스 체크
```
GET /health
```

### 분석 요청
```
POST /api/analyze
Content-Type: application/json

{
  "hashtag": "#OOTD",
  "platform": "instagram",
  "max_posts": 100
}
```

## 향후 개발

1. 실제 크롤링 API 통합
2. 비전 AI 모델 통합 (PyTorch/TensorFlow)
3. GPU 가속 설정
4. 캐싱 시스템
5. 배치 처리 최적화
