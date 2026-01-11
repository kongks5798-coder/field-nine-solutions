import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * 인간다움 레이어 API
 * 한국 소비자 감성 직격: 서사 스토리텔링, 감성 톤 조절
 */

interface HumanTouchRequest {
  type: 'product-recommendation' | 'customer-service' | 'sentiment-score';
  context: any;
}

// 상품 추천 서사 스토리텔링 생성
function generateProductStory(product: any, customer: any) {
  const stories = {
    winter: [
      `이 ${product.name} 입으면 연말 데이트 분위기 UP! 나다운 따뜻함 느껴보세요 ❄️✨`,
      `겨울밤에 이 옷 입고 나가면 온도는 내려가도 마음은 따뜻해져요. 당신만의 스타일을 완성해보세요 🧥`,
      `추운 날씨도 이제 두렵지 않아요. 이 ${product.name}와 함께 따뜻한 겨울을 보내세요 🌨️`,
    ],
    summer: [
      `여름 휴가에 딱! 이 ${product.name} 입고 해변가를 걸으면 시선 강탈 각이에요 🏖️`,
      `뜨거운 여름에도 시원하게. 이 옷 하나면 완벽한 여름 스타일 완성! ☀️`,
      `여름 파티의 주인공이 되고 싶다면? 이 ${product.name}가 답이에요 🎉`,
    ],
    autumn: [
      `가을 낙엽 위를 걸으며 이 ${product.name}의 따뜻함을 느껴보세요. 로맨틱한 가을이 시작돼요 🍂`,
      `가을 데이트룩 완성! 이 옷 입으면 상대방이 한눈에 팔릴 거예요 💕`,
      `가을의 정석. 이 ${product.name}와 함께 멋진 가을을 만들어보세요 🍁`,
    ],
    spring: [
      `봄이 왔어요! 이 ${product.name} 입고 벚꽃 구경 가세요. 사진 찍으면 인스타 핫게 각이에요 🌸`,
      `봄 데이트에 완벽한 선택. 이 옷 하나면 봄의 주인공이 될 수 있어요 💐`,
      `따뜻한 봄날, 이 ${product.name}와 함께 새로운 시작을 해보세요 🌺`,
    ],
  };

  const season = getSeason();
  const seasonStories = stories[season as keyof typeof stories] || stories.spring;
  return seasonStories[Math.floor(Math.random() * seasonStories.length)];
}

function getSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

// 고객 문의 자동 응대 감성 톤 조절
function generateCustomerServiceResponse(customerSentiment: 'angry' | 'happy' | 'neutral' | 'sad', inquiry: string) {
  const responses = {
    angry: [
      `정말 죄송합니다. 불편을 드려서 진심으로 사과드립니다. 😔\n\n${inquiry}에 대해 즉시 확인하고 해결해드리겠습니다. 추가로 특별 할인 쿠폰도 드릴게요.`,
      `불편하셨을 것 같아 정말 죄송합니다. 🙏\n\n${inquiry} 문제를 최우선으로 처리하겠습니다. 빠른 시일 내에 해결해드리겠습니다.`,
    ],
    happy: [
      `정말 기쁜 소식이네요! 축하드립니다! 🎉\n\n${inquiry}에 대해 더 도와드릴 수 있는 부분이 있으면 언제든 말씀해주세요.`,
      `좋은 소식 들려주셔서 저희도 기뻐요! 😊\n\n${inquiry} 관련해서 추가로 필요한 게 있으시면 언제든 연락주세요.`,
    ],
    sad: [
      `안타까운 마음이 전해지네요. 😢\n\n${inquiry}에 대해 최선을 다해 도와드리겠습니다. 함께 해결해나가요.`,
      `힘드시겠어요. 위로가 되고 싶어요. 💙\n\n${inquiry} 문제를 해결하는 데 도움이 되도록 최선을 다하겠습니다.`,
    ],
    neutral: [
      `안녕하세요! ${inquiry}에 대해 도와드리겠습니다. 🙂\n\n자세한 내용을 확인하고 빠르게 답변드리겠습니다.`,
      `네, ${inquiry} 관련해서 확인해드리겠습니다. 📋\n\n잠시만 기다려주시면 정확한 답변 드리겠습니다.`,
    ],
  };

  const sentimentResponses = responses[customerSentiment] || responses.neutral;
  return sentimentResponses[Math.floor(Math.random() * sentimentResponses.length)];
}

// 감성 점수 계산
function calculateSentimentScore(reviews: any[], inquiries: any[]) {
  const reviewSentiments = reviews.map((r: any) => {
    if (r.rating >= 4) return 1;
    if (r.rating >= 3) return 0.5;
    return 0;
  });
  
  const inquirySentiments = inquiries.map((i: any) => {
    if (i.sentiment === 'happy') return 1;
    if (i.sentiment === 'neutral') return 0.5;
    if (i.sentiment === 'angry' || i.sentiment === 'sad') return 0;
    return 0.5;
  });

  const totalScore = [...reviewSentiments, ...inquirySentiments].reduce((a: number, b: number) => a + b, 0);
  const maxScore = reviews.length + inquiries.length;
  const score = maxScore > 0 ? (totalScore / maxScore) * 100 : 50;

  // 개선 팁 생성
  const tips = [];
  if (score < 70) {
    tips.push('고객 응대 응답 시간 단축 필요 (목표: 1시간 이내)');
    tips.push('부정 리뷰에 대한 적극적인 대응 필요');
  }
  if (score < 85) {
    tips.push('상품 설명을 더 상세하게 개선');
    tips.push('배송 추적 정보 제공 강화');
  }
  if (score >= 85) {
    tips.push('현재 우수한 고객 만족도 유지 중!');
    tips.push('추가 서비스로 고객 충성도 더 높이기');
  }

  return {
    score: Math.round(score),
    level: score >= 90 ? 'excellent' : score >= 80 ? 'good' : score >= 70 ? 'fair' : 'poor',
    tips,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: HumanTouchRequest = await request.json();
    const { type, context } = body;

    let result;

    switch (type) {
      case 'product-recommendation':
        result = {
          story: generateProductStory(context.product, context.customer),
          tone: 'warm',
          emoji: true,
        };
        break;
      case 'customer-service':
        result = {
          response: generateCustomerServiceResponse(
            context.sentiment || 'neutral',
            context.inquiry || ''
          ),
          tone: context.sentiment || 'neutral',
        };
        break;
      case 'sentiment-score':
        const sentimentData = calculateSentimentScore(
          context.reviews || [],
          context.inquiries || []
        );
        result = {
          score: sentimentData.score,
          level: sentimentData.level,
          tips: sentimentData.tips,
          message: `이번 주 고객 감성 점수: ${sentimentData.score}점`,
        };
        break;
      default:
        return NextResponse.json(
          { error: '알 수 없는 타입입니다.' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      type,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Human Touch API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '인간다움 레이어 생성 중 오류가 발생했습니다.',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
