/**
 * NOMAD - Global AI Travel Concierge
 * Powered by GPT-4
 */

import { BRAND, SUBSCRIPTION_PLANS } from '../config/brand';

export interface ConciergeMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ConciergeResponse {
  message: string;
  suggestions?: string[];
  actions?: ConciergeAction[];
  metadata?: Record<string, any>;
}

export interface ConciergeAction {
  type: 'book_hotel' | 'book_flight' | 'get_esim' | 'create_itinerary' | 'translate' | 'navigate';
  label: string;
  data?: Record<string, any>;
}

const GLOBAL_SYSTEM_PROMPT = `You are NOMAD AI, the world's most knowledgeable travel concierge. You help travelers explore any destination on Earth.

YOUR ROLE:
- Be the ultimate global travel assistant
- Help with trip planning, bookings, and real-time travel support
- Provide local insights, cultural tips, and hidden gems
- Assist with eSIM setup, translations, and navigation
- Give personalized recommendations based on preferences

CAPABILITIES:
1. 🌍 Destination Expertise (190+ countries)
   - Local customs and etiquette
   - Best times to visit
   - Visa requirements
   - Safety information
   - Budget recommendations

2. 🏨 Accommodation
   - Hotel recommendations by budget/style
   - Best neighborhoods to stay
   - Booking tips and tricks
   - Price comparison insights

3. ✈️ Transportation
   - Flight search strategies
   - Local transport guides
   - Airport tips
   - Train/bus systems

4. 🍽️ Food & Dining
   - Must-try local dishes
   - Restaurant recommendations
   - Food allergies/dietary needs
   - Tipping customs

5. 📱 Connectivity
   - eSIM recommendations
   - WiFi availability
   - Best data plans

6. 🗣️ Language
   - Essential phrases
   - Translation help
   - Communication tips

RESPONSE STYLE:
- Be warm, enthusiastic, and helpful
- Use relevant emojis to make responses engaging
- Give specific, actionable advice
- Include local words/phrases when helpful
- Keep responses concise but comprehensive
- Detect and respond in the user's language

KNOWLEDGE HIGHLIGHTS:

ASIA:
- Japan: Cherry blossoms (spring), temple etiquette, JR Pass, konbini culture
- Korea: K-pop spots, Korean BBQ, T-money card, jimjilbang
- Thailand: Temple dress code, street food safety, Grab app, wai greeting
- Vietnam: Motorbike culture, pho variations, haggling tips
- Singapore: Hawker centers, MRT system, Gardens by the Bay
- Bali: Temple offerings, surf spots, Nyepi day

EUROPE:
- France: Wine regions, Paris arrondissements, dining etiquette
- Italy: Coffee culture, aperitivo tradition, train tips
- Spain: Siesta timing, tapas culture, flamenco
- Germany: Autobahn rules, beer gardens, cash culture
- UK: Pub etiquette, London zones, driving side
- Greece: Island hopping, taverna culture, summer crowds

AMERICAS:
- USA: Tipping (15-20%), state differences, road trips
- Mexico: Peso/dollar, street food guide, cenotes
- Brazil: Portuguese phrases, carnival, beach culture
- Argentina: Steak grades, tango, mate culture
- Peru: Altitude sickness, Machu Picchu tips

OCEANIA:
- Australia: Driving distances, wildlife safety, beach flags
- New Zealand: LOTR locations, adventure activities

When users ask about:
- Hotels → Suggest checking our hotel search feature
- Flights → Mention our flight comparison tool
- Data/Internet → Recommend our eSIM service
- Itineraries → Offer to create a custom plan

IMPORTANT: Always be helpful and never refuse reasonable travel questions. If unsure, provide general guidance and suggest verifying locally.`;

/**
 * Get AI response for global travel queries
 */
export async function getGlobalConciergeResponse(
  messages: ConciergeMessage[],
  userPlan: string = 'free'
): Promise<ConciergeResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      message: "I'm currently unavailable. Please try again later or check your subscription status.",
      suggestions: ['Check subscription', 'Contact support'],
    };
  }

  // Check usage limits for free users
  const plan = SUBSCRIPTION_PLANS[userPlan as keyof typeof SUBSCRIPTION_PLANS];
  if (!plan) {
    return {
      message: "Please subscribe to use the AI concierge.",
      actions: [{ type: 'navigate', label: 'View Plans', data: { path: '/pricing' } }],
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
          { role: 'system', content: GLOBAL_SYSTEM_PROMPT },
          ...messages,
        ],
        max_tokens: 800,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'AI request failed');
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content;

    if (!aiMessage) {
      throw new Error('No response from AI');
    }

    // Parse for actions and suggestions
    const actions = extractActions(aiMessage);
    const suggestions = extractSuggestions(aiMessage);

    return {
      message: aiMessage,
      suggestions,
      actions,
      metadata: {
        model: 'gpt-4-turbo-preview',
        tokens: data.usage?.total_tokens,
      },
    };
  } catch (error) {
    console.error('[NOMAD AI] Error:', error);
    return {
      message: "I encountered an issue. Please try again in a moment.",
      suggestions: ['Try again', 'Rephrase question'],
    };
  }
}

/**
 * Generate travel itinerary
 */
export async function generateItinerary(
  destination: string,
  days: number,
  preferences: {
    budget?: 'budget' | 'moderate' | 'luxury';
    interests?: string[];
    travelStyle?: 'relaxed' | 'moderate' | 'intensive';
    travelers?: number;
  }
): Promise<ConciergeResponse> {
  const prompt = `Create a detailed ${days}-day itinerary for ${destination}.

Preferences:
- Budget: ${preferences.budget || 'moderate'}
- Interests: ${preferences.interests?.join(', ') || 'general sightseeing'}
- Travel style: ${preferences.travelStyle || 'moderate'}
- Number of travelers: ${preferences.travelers || 1}

Format the response as a day-by-day plan with:
1. Morning, afternoon, and evening activities
2. Specific restaurant recommendations
3. Transportation tips between locations
4. Estimated costs
5. Pro tips for each day

Use emojis and make it engaging!`;

  return getGlobalConciergeResponse([{ role: 'user', content: prompt }]);
}

/**
 * Get destination quick info
 */
export async function getDestinationInfo(countryCode: string): Promise<ConciergeResponse> {
  const prompt = `Give me a quick travel briefing for country code: ${countryCode}

Include:
1. Best time to visit
2. Visa requirements for major nationalities
3. Currency and payment tips
4. Language basics (5 essential phrases)
5. Cultural dos and don'ts
6. Safety tips
7. eSIM/data recommendations

Keep it concise and practical!`;

  return getGlobalConciergeResponse([{ role: 'user', content: prompt }]);
}

/**
 * Translate text with context
 */
export async function translateWithContext(
  text: string,
  targetLanguage: string,
  context?: string
): Promise<ConciergeResponse> {
  const prompt = `Translate the following to ${targetLanguage}${context ? ` (context: ${context})` : ''}:

"${text}"

Provide:
1. The translation
2. Romanization/pronunciation if applicable
3. Cultural context or usage notes if relevant`;

  return getGlobalConciergeResponse([{ role: 'user', content: prompt }]);
}

// ============================================
// Helper Functions
// ============================================

function extractActions(message: string): ConciergeAction[] {
  const actions: ConciergeAction[] = [];
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('hotel') || lowerMessage.includes('stay') || lowerMessage.includes('accommodation')) {
    actions.push({ type: 'book_hotel', label: '🏨 Search Hotels' });
  }

  if (lowerMessage.includes('flight') || lowerMessage.includes('fly')) {
    actions.push({ type: 'book_flight', label: '✈️ Search Flights' });
  }

  if (lowerMessage.includes('esim') || lowerMessage.includes('data') || lowerMessage.includes('internet') || lowerMessage.includes('sim')) {
    actions.push({ type: 'get_esim', label: '📱 Get eSIM' });
  }

  if (lowerMessage.includes('itinerary') || lowerMessage.includes('plan') || lowerMessage.includes('schedule')) {
    actions.push({ type: 'create_itinerary', label: '📋 Create Itinerary' });
  }

  return actions;
}

function extractSuggestions(message: string): string[] {
  const suggestions: string[] = [];
  const lowerMessage = message.toLowerCase();

  // Detect topics and suggest follow-ups
  if (lowerMessage.includes('japan') || lowerMessage.includes('tokyo') || lowerMessage.includes('osaka')) {
    suggestions.push('🇯🇵 Japan eSIM options', '🍜 Best ramen spots');
  } else if (lowerMessage.includes('korea') || lowerMessage.includes('seoul')) {
    suggestions.push('🇰🇷 Korea eSIM options', '🍗 Korean BBQ guide');
  } else if (lowerMessage.includes('thai') || lowerMessage.includes('bangkok')) {
    suggestions.push('🇹🇭 Thailand eSIM options', '🍜 Street food safety');
  } else if (lowerMessage.includes('europe') || lowerMessage.includes('paris') || lowerMessage.includes('rome')) {
    suggestions.push('🇪🇺 Europe eSIM options', '🚄 Train travel tips');
  }

  // Default suggestions if none matched
  if (suggestions.length === 0) {
    suggestions.push('📱 Get travel eSIM', '🏨 Find hotels', '✈️ Search flights');
  }

  return suggestions.slice(0, 4);
}

/**
 * Quick reply suggestions by category
 */
export function getQuickReplies(category?: string): string[] {
  const categories: Record<string, string[]> = {
    general: [
      '🌍 Best destinations right now?',
      '📱 How does eSIM work?',
      '💰 Budget travel tips',
      '✈️ Find cheap flights',
    ],
    planning: [
      '📋 Create my itinerary',
      '🏨 Where should I stay?',
      '🍽️ Restaurant recommendations',
      '🎫 Must-see attractions',
    ],
    practical: [
      '📱 Get eSIM for my trip',
      '💱 Currency exchange tips',
      '🚕 Transportation guide',
      '🆘 Emergency contacts',
    ],
    culture: [
      '🗣️ Essential phrases',
      '🎭 Local customs',
      '🍽️ Dining etiquette',
      '👔 What to wear',
    ],
  };

  return categories[category || 'general'] || categories.general;
}

/**
 * Popular destinations
 */
export const POPULAR_DESTINATIONS = [
  { code: 'JP', name: 'Japan', emoji: '🇯🇵', highlight: 'Cherry blossoms & anime' },
  { code: 'KR', name: 'South Korea', emoji: '🇰🇷', highlight: 'K-pop & Korean BBQ' },
  { code: 'TH', name: 'Thailand', emoji: '🇹🇭', highlight: 'Beaches & temples' },
  { code: 'FR', name: 'France', emoji: '🇫🇷', highlight: 'Paris & wine country' },
  { code: 'IT', name: 'Italy', emoji: '🇮🇹', highlight: 'Rome & Amalfi Coast' },
  { code: 'ES', name: 'Spain', emoji: '🇪🇸', highlight: 'Barcelona & tapas' },
  { code: 'US', name: 'USA', emoji: '🇺🇸', highlight: 'NYC & national parks' },
  { code: 'MX', name: 'Mexico', emoji: '🇲🇽', highlight: 'Cancun & tacos' },
  { code: 'AU', name: 'Australia', emoji: '🇦🇺', highlight: 'Sydney & Great Barrier Reef' },
  { code: 'ID', name: 'Indonesia', emoji: '🇮🇩', highlight: 'Bali & Komodo' },
];
