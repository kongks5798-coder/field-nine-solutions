import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { createClient } from '@/src/utils/supabase/server';
import { formatErrorResponse, logError, AppError } from '@/lib/error-handler';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * AI 추천 생성 API
 * 사용자 프로필 기반 개인화 추천 생성
 */

interface RecommendationRequest {
  category?: string;
  limit?: number;
}

// 가격 예측 함수 (Prophet/XGBoost 기반)
function predictPriceDrop(currentPrice: number, daysAhead: number = 7): {
  predictedPrice: number;
  dropPercentage: number;
  confidence: number;
} {
  // 간단한 예측 모델 (실제로는 Prophet/XGBoost 사용)
  const trendFactor = 0.95; // 5% 하락 추세
  const predictedPrice = Math.round(currentPrice * Math.pow(trendFactor, daysAhead / 30));
  const dropPercentage = Math.round(((currentPrice - predictedPrice) / currentPrice) * 100);
  const confidence = 0.75; // 75% 신뢰도

  return {
    predictedPrice,
    dropPercentage,
    confidence,
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const body: RecommendationRequest = await request.json();
    const limit = body.limit || 5;

    const supabase = await createClient();

    // 사용자 프로필 조회
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // OpenAI 클라이언트 초기화
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API 키가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });

    // 모의 상품 데이터 (실제로는 쇼핑몰 API에서 가져옴)
    const mockProducts = [
      {
        name: '나이키 에어맥스 270',
        brand: 'Nike',
        category: '운동화',
        currentPrice: 150000,
        url: 'https://example.com/product1',
        imageUrl: 'https://example.com/image1.jpg',
      },
      {
        name: '아디다스 울트라부스트 22',
        brand: 'Adidas',
        category: '운동화',
        currentPrice: 180000,
        url: 'https://example.com/product2',
        imageUrl: 'https://example.com/image2.jpg',
      },
      {
        name: '컨버스 척 테일러',
        brand: 'Converse',
        category: '운동화',
        currentPrice: 80000,
        url: 'https://example.com/product3',
        imageUrl: 'https://example.com/image3.jpg',
      },
    ];

    // 사용자 프로필 기반 필터링
    const filteredProducts = mockProducts.filter((product) => {
      if (profile?.preferred_brands && profile.preferred_brands.length > 0) {
        return profile.preferred_brands.includes(product.brand);
      }
      if (profile?.budget_max && product.currentPrice > profile.budget_max) {
        return false;
      }
      if (profile?.budget_min && product.currentPrice < profile.budget_min) {
        return false;
      }
      return true;
    });

    // 추천 생성
    const recommendations = await Promise.all(
      filteredProducts.slice(0, limit).map(async (product) => {
        // 가격 예측
        const pricePrediction = predictPriceDrop(product.currentPrice, 7);
        const estimatedSavings = product.currentPrice - pricePrediction.predictedPrice;

        // OpenAI로 개인화된 추천 이유 생성
        const recommendationPrompt = `사용자 프로필:
- 예산: ${profile?.budget_min || 0}원 ~ ${profile?.budget_max || 1000000}원
- 선호 브랜드: ${profile?.preferred_brands?.join(', ') || '없음'}
- 선호 카테고리: ${profile?.preferred_categories?.join(', ') || '없음'}

상품 정보:
- 이름: ${product.name}
- 브랜드: ${product.brand}
- 현재 가격: ${product.currentPrice.toLocaleString()}원
- 예상 가격 하락: ${pricePrediction.dropPercentage}% (약 ${pricePrediction.predictedPrice.toLocaleString()}원)

이 상품을 추천하는 이유를 한국어로 간단하고 친근하게 설명해주세요. (최대 2문장)`;

        let recommendationReason = `${product.name}이(가) 현재 ${product.currentPrice.toLocaleString()}원에 판매 중입니다.`;
        
        try {
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              {
                role: 'system',
                content: '당신은 친근한 쇼핑 어시스턴트입니다. 사용자에게 상품을 추천할 때 간단하고 명확하게 설명합니다.',
              },
              {
                role: 'user',
                content: recommendationPrompt,
              },
            ],
            max_tokens: 150,
            temperature: 0.7,
          });

          recommendationReason = completion.choices[0]?.message?.content || recommendationReason;
        } catch (error) {
          console.error('[Recommendation] OpenAI API 오류:', error);
          // OpenAI 실패 시 기본 메시지 사용
        }

        return {
          product_name: product.name,
          product_url: product.url,
          product_image_url: product.imageUrl,
          brand: product.brand,
          category: product.category,
          current_price: product.currentPrice,
          original_price: product.currentPrice,
          discount_percentage: 0,
          predicted_price_drop: pricePrediction.predictedPrice,
          predicted_drop_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          recommendation_reason: recommendationReason,
          ai_confidence: pricePrediction.confidence,
          data_sources: ['가격 예측 모델', 'OpenAI 추천 엔진'],
          price_history: [],
          estimated_savings: estimatedSavings > 0 ? estimatedSavings : 0,
        };
      })
    );

    // 데이터베이스에 저장
    const { data: savedRecommendations, error: saveError } = await supabase
      .from('product_recommendations')
      .insert(
        recommendations.map((rec) => ({
          user_id: user.id,
          ...rec,
          status: 'pending',
        }))
      )
      .select();

    if (saveError) {
      logError(saveError, { action: 'save_recommendations', userId: user.id });
    }

    // 프로필 통계 업데이트
    if (savedRecommendations && savedRecommendations.length > 0) {
      const totalSavings = recommendations.reduce((sum, rec) => sum + rec.estimated_savings, 0);
      
      await supabase
        .from('user_profiles')
        .update({
          total_recommendations: (profile?.total_recommendations || 0) + savedRecommendations.length,
          total_savings: (profile?.total_savings || 0) + totalSavings,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);
    }

    return NextResponse.json({
      success: true,
      recommendations: savedRecommendations || recommendations,
      total_savings: recommendations.reduce((sum, rec) => sum + rec.estimated_savings, 0),
    });
  } catch (error: unknown) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    logError(errorObj, { action: 'generate_recommendations' });
    const errorResponse = formatErrorResponse(errorObj);
    const statusCode = errorObj instanceof AppError ? errorObj.statusCode : 500;
    return NextResponse.json(
      {
        success: false,
        error: errorResponse.error,
        code: errorResponse.code,
      },
      { status: statusCode }
    );
  }
}
