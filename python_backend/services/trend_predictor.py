"""
Trend Predictor - 트렌드 예측 알고리즘

비즈니스 목적:
- 크롤링된 데이터를 기반으로 트렌드 예측
- Top 3 Colors, Top 3 Items 추출
- 예측 신뢰도 계산
"""
from typing import List, Dict
from collections import Counter

class TrendPredictor:
    """
    트렌드 예측기
    
    알고리즘:
    1. 모든 이미지의 색상/아이템 빈도 계산
    2. 최근 게시물에 가중치 부여 (최신 트렌드 반영)
    3. Top 3 추출
    """
    
    def predict_trends(self, analysis_results: List[Dict]) -> Dict:
        """
        트렌드 예측
        
        Args:
            analysis_results: VisionAnalyzer의 분석 결과
            
        Returns:
            {
                "top_colors": ["color1", "color2", "color3"],
                "top_items": ["item1", "item2", "item3"],
                "confidence": 0.85
            }
        """
        if not analysis_results:
            return {
                "top_colors": [],
                "top_items": [],
                "confidence": 0.0
            }
        
        # 색상 빈도 계산
        all_colors = []
        for result in analysis_results:
            all_colors.extend(result.get("colors", []))
        
        color_counter = Counter(all_colors)
        top_colors = [color for color, _ in color_counter.most_common(3)]
        
        # 아이템 빈도 계산
        all_items = []
        for result in analysis_results:
            all_items.extend(result.get("items", []))
        
        item_counter = Counter(all_items)
        top_items = [item for item, _ in item_counter.most_common(3)]
        
        # 신뢰도 계산 (데이터 양 기반)
        confidence = min(len(analysis_results) / 100.0, 1.0)
        
        return {
            "top_colors": top_colors[:3],
            "top_items": top_items[:3],
            "confidence": round(confidence, 2)
        }
