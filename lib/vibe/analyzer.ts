/**
 * VIBE-ID Analyzer
 * GPT-4o Vision을 사용한 셀피 분석
 */

import OpenAI from 'openai';
import { VibeAnalysis, VibeArchetype, VIBE_ARCHETYPES } from './types';

// ============================================
// OpenAI Client (Lazy Init)
// ============================================

let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

// ============================================
// Analysis Prompt
// ============================================

const VIBE_ANALYSIS_PROMPT = `You are an expert aesthetic analyst for a premium travel recommendation service. Analyze this selfie photo and determine the person's travel aesthetic/vibe.

IMPORTANT: Respond ONLY with a valid JSON object, no markdown, no explanation, just the raw JSON.

The JSON must follow this exact structure:
{
  "primary": "<one of: silent-luxury, urban-explorer, nature-seeker, culture-lover, beach-soul, adventure-spirit, foodie-wanderer, minimalist, romantic-dreamer>",
  "secondary": "<same options, must be different from primary>",
  "confidence": <number between 0.7 and 0.95>,
  "traits": ["<Korean trait 1>", "<Korean trait 2>", "<Korean trait 3>"],
  "colorPalette": ["<hex color 1>", "<hex color 2>", "<hex color 3>"],
  "description": "<2-3 sentence English description of their travel vibe>",
  "koreanDescription": "<2-3 sentence Korean description of their travel vibe>"
}

Vibe Type Meanings:
- silent-luxury: Understated elegance, quality over quantity, refined taste
- urban-explorer: City lover, trendy, seeks hidden gems in metropolises
- nature-seeker: Finds peace in mountains, forests, natural landscapes
- culture-lover: History buff, museum goer, appreciates art and heritage
- beach-soul: Sun seeker, ocean lover, laid-back vibes
- adventure-spirit: Thrill seeker, loves extreme sports and unique experiences
- foodie-wanderer: Travels for food, culinary adventurer
- minimalist: Clean design lover, Scandinavian aesthetic, simple pleasures
- romantic-dreamer: Seeks magical moments, picturesque views, fairy tale settings

Analyze based on:
1. Facial expression and overall demeanor
2. Style choices visible (clothing, accessories, hair, makeup)
3. Background/setting if visible
4. Overall mood and energy radiating from the photo
5. Color preferences visible in their choices

Be POSITIVE and EMPOWERING in your description. Focus on their best qualities.
The Korean traits should be flattering adjectives like: 세련됨, 지적임, 자유로움, 따뜻함, 모험심, 감각적, 여유로움, 호기심, 낭만적, 활동적`;

// ============================================
// Analyze Selfie
// ============================================

export async function analyzeSelfi(imageBase64: string): Promise<VibeAnalysis> {
  const openai = getOpenAI();

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: VIBE_ANALYSIS_PROMPT,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64.startsWith('data:')
                  ? imageBase64
                  : `data:image/jpeg;base64,${imageBase64}`,
                detail: 'low', // Use low detail for faster response
              },
            },
          ],
        },
      ],
      max_tokens: 800,
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from GPT-4o');
    }

    // Parse JSON response
    const analysis = parseAnalysisResponse(content);
    return analysis;
  } catch (error) {
    console.error('GPT-4o Vision analysis error:', error);
    throw error;
  }
}

// ============================================
// Parse & Validate Response
// ============================================

function parseAnalysisResponse(content: string): VibeAnalysis {
  // Try to extract JSON from response
  let jsonStr = content.trim();

  // Remove markdown code blocks if present
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```\n?/g, '');
  }

  try {
    const parsed = JSON.parse(jsonStr);

    // Validate and sanitize response
    const analysis: VibeAnalysis = {
      primary: validateVibeType(parsed.primary),
      secondary: validateVibeType(parsed.secondary, parsed.primary),
      confidence: validateConfidence(parsed.confidence),
      traits: validateTraits(parsed.traits),
      colorPalette: validateColors(parsed.colorPalette),
      description: String(parsed.description || 'A unique traveler with distinctive style'),
      koreanDescription: String(
        parsed.koreanDescription || '독특한 스타일을 가진 여행자입니다'
      ),
    };

    return analysis;
  } catch (parseError) {
    console.error('Failed to parse GPT response:', content);
    // Return default analysis on parse failure
    return getDefaultAnalysis();
  }
}

function validateVibeType(
  type: string,
  exclude?: string
): VibeArchetype {
  const validType = VIBE_ARCHETYPES.find((v) => v === type);
  if (validType && validType !== exclude) {
    return validType;
  }
  // Return random valid type if invalid
  const available = exclude
    ? VIBE_ARCHETYPES.filter((v) => v !== exclude)
    : VIBE_ARCHETYPES;
  return available[Math.floor(Math.random() * available.length)];
}

function validateConfidence(confidence: number): number {
  const num = Number(confidence);
  if (isNaN(num)) return 0.85;
  return Math.min(0.95, Math.max(0.7, num));
}

function validateTraits(traits: unknown): string[] {
  if (!Array.isArray(traits)) {
    return ['세련됨', '호기심', '감각적'];
  }
  return traits.slice(0, 5).map((t) => String(t));
}

function validateColors(colors: unknown): string[] {
  if (!Array.isArray(colors)) {
    return ['#2C3E50', '#ECF0F1', '#3498DB'];
  }
  return colors.slice(0, 3).map((c) => {
    const color = String(c);
    // Validate hex color format
    if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return color;
    }
    return '#2C3E50';
  });
}

function getDefaultAnalysis(): VibeAnalysis {
  return {
    primary: 'urban-explorer',
    secondary: 'foodie-wanderer',
    confidence: 0.85,
    traits: ['호기심', '활동적', '감각적'],
    colorPalette: ['#1A1A2E', '#FF6B6B', '#FFEAA7'],
    description:
      'An adventurous soul who finds excitement in exploring new places and experiences.',
    koreanDescription:
      '새로운 장소와 경험을 탐험하며 즐거움을 찾는 모험적인 영혼입니다.',
  };
}

// ============================================
// Fallback Analysis (for API errors)
// ============================================

export function getFallbackAnalysis(): VibeAnalysis {
  const vibes: VibeArchetype[] = [
    'urban-explorer',
    'nature-seeker',
    'culture-lover',
    'foodie-wanderer',
  ];
  const primary = vibes[Math.floor(Math.random() * vibes.length)];
  const secondary = vibes.find((v) => v !== primary) || 'urban-explorer';

  return {
    primary,
    secondary,
    confidence: 0.8,
    traits: ['호기심', '열정적', '자유로움'],
    colorPalette: ['#2C3E50', '#E74C3C', '#ECF0F1'],
    description: 'A curious traveler ready to explore the world.',
    koreanDescription: '세상을 탐험할 준비가 된 호기심 많은 여행자입니다.',
  };
}
