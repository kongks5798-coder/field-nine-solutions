"""
Analysis Router - 트렌드 분석 API 엔드포인트

비즈니스 목적:
- 사용자가 입력한 해시태그를 기반으로 트렌드 분석 실행
- 크롤링 → 비전 분석 → 트렌드 예측 파이프라인 실행
"""
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List
from datetime import datetime

from services.crawler import SocialMediaCrawler
from services.vision_ai import VisionAnalyzer
from services.trend_predictor import TrendPredictor

router = APIRouter()

class AnalyzeRequest(BaseModel):
    """분석 요청 모델"""
    hashtag: str
    platform: str = "instagram"  # instagram 또는 tiktok
    max_posts: int = 100  # 최대 분석할 게시물 수

class AnalyzeResponse(BaseModel):
    """분석 결과 모델"""
    hashtag: str
    platform: str
    top_colors: List[str]
    top_items: List[str]
    confidence: float  # 예측 신뢰도 (0-1)
    analyzed_posts: int
    timestamp: datetime

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_hashtag(
    request: AnalyzeRequest,
    background_tasks: BackgroundTasks
):
    """
    해시태그 분석 엔드포인트
    
    프로세스:
    1. 소셜미디어 크롤링 (인스타그램/틱톡)
    2. 비전 AI로 이미지 분석 (색상, 아이템 추출)
    3. 트렌드 예측 알고리즘 실행
    4. 결과 반환
    """
    try:
        # 1. 크롤링
        crawler = SocialMediaCrawler()
        images = await crawler.crawl_hashtag(
            hashtag=request.hashtag,
            platform=request.platform,
            max_posts=request.max_posts
        )
        
        if not images:
            raise HTTPException(
                status_code=404,
                detail=f"해시태그 '{request.hashtag}'에 대한 게시물을 찾을 수 없습니다."
            )
        
        # 2. 비전 AI 분석
        vision_analyzer = VisionAnalyzer()
        analysis_results = await vision_analyzer.analyze_images(images)
        
        # 3. 트렌드 예측
        predictor = TrendPredictor()
        prediction = predictor.predict_trends(analysis_results)
        
        # 4. 결과 반환
        return AnalyzeResponse(
            hashtag=request.hashtag,
            platform=request.platform,
            top_colors=prediction["top_colors"],
            top_items=prediction["top_items"],
            confidence=prediction["confidence"],
            analyzed_posts=len(images),
            timestamp=datetime.now()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"분석 중 오류가 발생했습니다: {str(e)}"
        )
