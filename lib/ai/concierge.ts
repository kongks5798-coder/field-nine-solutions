/**
 * K-UNIVERSAL AI Concierge
 * Real-time customer support with GPT-4
 */

export interface ConciergeMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ConciergeResponse {
  message: string;
  suggestions?: string[];
  action?: 'redirect' | 'escalate' | 'complete';
  metadata?: Record<string, any>;
}

const SYSTEM_PROMPT = `You are Jarvis, the AI Concierge for K-Universal - a Super App for foreigners traveling in Korea.

YOUR ROLE:
- Be the ultimate Korea travel assistant for foreigners
- Help with taxi booking, food delivery, shopping recommendations
- Provide real-time translation and cultural tips
- Guide users through the app features (wallet, payments, KYC)
- Answer any Korea travel questions

KNOWLEDGE BASE:

1. K-Universal Services:
   - K-Taxi: Book taxis anywhere in Korea (Kakao T integrated)
   - K-Food: Order Korean food delivery (치킨, 짜장면, 삼겹살, etc.)
   - Ghost Wallet: QR payments accepted at 500,000+ stores
   - Currency Exchange: Better rates than airport, instant swap
   - Tax Refund: Instant tax-free shopping refunds

2. Popular Korean Phrases:
   - 안녕하세요 (Annyeonghaseyo) - Hello
   - 감사합니다 (Gamsahamnida) - Thank you
   - 얼마예요? (Eolmayeyo?) - How much?
   - 이거 주세요 (Igeo juseyo) - Please give me this
   - 화장실 어디예요? (Hwajangsil eodiyeyo?) - Where's the bathroom?

3. Must-Visit Places:
   - Seoul: Myeongdong (shopping), Hongdae (nightlife), Gyeongbokgung (palace)
   - Busan: Haeundae Beach, Gamcheon Culture Village
   - Jeju: Hallasan, Seongsan Ilchulbong

4. Korean Food Guide:
   - 삼겹살 (Samgyeopsal): Grilled pork belly, wrap in lettuce
   - 치킨 (Chikin): Korean fried chicken, best with beer (치맥)
   - 떡볶이 (Tteokbokki): Spicy rice cakes, street food favorite
   - 비빔밥 (Bibimbap): Mixed rice with vegetables
   - 김치찌개 (Kimchi-jjigae): Kimchi stew

5. Transportation Tips:
   - T-money card works on all public transport
   - Subway closes around midnight
   - Taxis: Black (premium) vs Orange/White (standard)
   - KTX for travel between cities (Seoul-Busan: 2.5 hours)

RESPONSE GUIDELINES:
- Respond in the user's language (detect automatically)
- Be friendly and enthusiastic about Korea
- Use relevant emojis: 🇰🇷 🚕 🍗 🛍️ 💳 🗺️
- Give specific, actionable advice
- Include Korean words with romanization when helpful
- Keep responses concise but informative

TONE: Friendly local friend who knows everything about Korea!`;

/**
 * Get AI response from GPT-4
 */
export async function getConciergeResponse(
  messages: ConciergeMessage[]
): Promise<ConciergeResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      message: '죄송합니다. AI 지원이 현재 이용 불가합니다. 잠시 후 다시 시도해주세요.',
      action: 'escalate',
    };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error('OpenAI API request failed');
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content;

    if (!aiMessage) {
      throw new Error('No response from AI');
    }

    // Parse response for structured data
    const suggestions = extractSuggestions(aiMessage);
    const action = detectAction(aiMessage);

    return {
      message: aiMessage,
      suggestions,
      action,
    };
  } catch (error) {
    console.error('Concierge AI error:', error);
    return {
      message: '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      action: 'escalate',
    };
  }
}

/**
 * Extract action suggestions from AI response
 */
function extractSuggestions(message: string): string[] {
  const suggestions: string[] = [];

  // Look for common action patterns
  if (message.includes('KYC') || message.includes('인증')) {
    suggestions.push('Start KYC verification');
  }
  if (message.includes('Wallet') || message.includes('지갑')) {
    suggestions.push('Open Ghost Wallet');
  }
  if (message.includes('charge') || message.includes('충전')) {
    suggestions.push('Top up balance');
  }

  return suggestions;
}

/**
 * Detect action type from AI response
 */
function detectAction(message: string): 'redirect' | 'escalate' | 'complete' {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('redirect') || lowerMessage.includes('go to')) {
    return 'redirect';
  }
  if (lowerMessage.includes('contact support') || lowerMessage.includes('human')) {
    return 'escalate';
  }
  return 'complete';
}

/**
 * Get quick reply templates for Korea travel
 */
export function getQuickReplies(): string[] {
  return [
    '🚕 How do I call a taxi?',
    '🍗 Best Korean food to try?',
    '🛍️ Where to shop in Seoul?',
    '💳 How to use QR payment?',
    '🗺️ Must-visit places?',
    '🇰🇷 Teach me Korean phrases',
  ];
}

/**
 * Get category-specific quick replies
 */
export function getCategoryQuickReplies(category: string): string[] {
  const categories: Record<string, string[]> = {
    food: [
      'What is Korean BBQ?',
      'Best chicken brands?',
      'Vegetarian options?',
      'Late night food spots?',
    ],
    transport: [
      'How to use subway?',
      'Airport to Seoul?',
      'Seoul to Busan?',
      'Night transport options?',
    ],
    shopping: [
      'Tax refund process?',
      'Best K-beauty brands?',
      'Duty free shopping?',
      'Local markets?',
    ],
    culture: [
      'Temple etiquette?',
      'Tipping in Korea?',
      'Korean age system?',
      'Drinking culture?',
    ],
  };
  return categories[category] || getQuickReplies();
}
