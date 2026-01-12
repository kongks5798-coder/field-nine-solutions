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

const SYSTEM_PROMPT = `You are Jarvis, the AI Concierge for K-Universal - a cutting-edge passport e-KYC and Ghost Wallet platform.

YOUR ROLE:
- Assist users with KYC verification questions
- Guide users through wallet setup and transactions
- Explain technical features in simple terms
- Provide instant, accurate support 24/7

KNOWLEDGE BASE:
1. KYC Process:
   - Upload passport data page
   - OCR extracts MRZ (Machine Readable Zone)
   - AI verifies with 99% accuracy
   - Auto-approval for valid passports

2. Ghost Wallet:
   - Non-custodial crypto wallet
   - Biometric authentication
   - Virtual card generation
   - Stripe integration for top-ups

3. Security:
   - End-to-end encryption (AES-256)
   - No private keys stored on servers
   - Row Level Security (Supabase)
   - PCI-DSS Level 1 compliance

RESPONSE GUIDELINES:
- Be concise and friendly
- Use emojis sparingly (🛂, 💳, ✅)
- Provide step-by-step instructions
- Suggest next actions
- Escalate complex issues to human support

TONE: Professional yet approachable, like a helpful assistant.`;

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
 * Get quick reply templates
 */
export function getQuickReplies(): string[] {
  return [
    'How do I start KYC?',
    'What is a Ghost Wallet?',
    'How to charge balance?',
    'Is my data secure?',
    'Supported countries?',
  ];
}
