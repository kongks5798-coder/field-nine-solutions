"""
Social Media Crawler - 인스타그램/틱톡 크롤링 서비스

비즈니스 목적:
- 해시태그 기반 게시물 크롤링
- 이미지 URL 추출
- 향후 실제 크롤링 API로 교체 예정 (현재는 Mock)
"""
from typing import List, Dict
import asyncio

class SocialMediaCrawler:
    """
    소셜미디어 크롤러
    
    주의: 실제 운영 시에는 공식 API 사용 권장
    - Instagram Basic Display API
    - TikTok API
    """
    
    async def crawl_hashtag(
        self,
        hashtag: str,
        platform: str = "instagram",
        max_posts: int = 100
    ) -> List[Dict[str, str]]:
        """
        해시태그 크롤링
        
        Returns:
            List[Dict]: [{"url": "image_url", "post_id": "id", ...}]
        """
        # TODO: 실제 크롤링 로직 구현
        # 현재는 Mock 데이터 반환
        
        await asyncio.sleep(0.5)  # 크롤링 시뮬레이션
        
        # Mock 이미지 데이터
        mock_images = [
            {
                "url": f"https://example.com/image_{i}.jpg",
                "post_id": f"post_{i}",
                "hashtag": hashtag,
                "platform": platform
            }
            for i in range(min(max_posts, 50))  # Mock: 최대 50개
        ]
        
        return mock_images
    
    async def crawl_user_posts(
        self,
        username: str,
        platform: str = "instagram",
        max_posts: int = 50
    ) -> List[Dict[str, str]]:
        """특정 사용자의 게시물 크롤링"""
        # TODO: 구현
        return []
