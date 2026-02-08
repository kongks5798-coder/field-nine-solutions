FROM python:3.11-slim

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 복사 및 설치
COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 프로젝트 파일 복사
COPY . .

# 환경변수
ENV PYTHONPATH=/app
ENV PORT=8000

# 포트 노출
EXPOSE 8000

# 서버 실행
CMD ["python", "api/run.py"]
