/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 57: VIBE-ID VIRAL CARD API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Generates viral aura card data for VIBE-ID + Referral integration
 *
 * GET: Fetch user's aura card data (requires auth)
 * POST: Generate new aura card from analysis result
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { VibeAnalysis, VibeArchetype, VIBE_LABELS } from '@/lib/vibe/types';

export const dynamic = 'force-dynamic';

// ============================================
// Types
// ============================================

interface AuraCardRecord {
  id: string;
  userId: string;
  sovereignNumber: number;
  referralCode: string;
  vibeType: VibeArchetype;
  secondaryVibe: VibeArchetype;
  confidence: number;
  traits: string[];
  colorPalette: string[];
  description: string;
  descriptionKo: string;
  cardId: string;
  shareCount: number;
  createdAt: string;
}

// ============================================
// Helper Functions
// ============================================

function generateCardId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `AURA-${timestamp}-${random}`.toUpperCase();
}

function generateReferralLink(code: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://fieldnine.io';
  return `${baseUrl}/join?ref=${code}`;
}

// ============================================
// GET: Fetch user's viral card data
// ============================================

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get user's profile with sovereign number and referral code
    const { data: profile } = await supabase
      .from('profiles')
      .select('sovereign_number, full_name')
      .eq('user_id', user.id)
      .single();

    // Get user's referral code
    const { data: referralCode } = await supabase
      .from('referral_codes')
      .select('code')
      .eq('user_id', user.id)
      .single();

    // Get user's latest VIBE-ID analysis (if stored)
    const { data: latestAnalysis } = await supabase
      .from('vibe_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!referralCode?.code) {
      return NextResponse.json(
        { success: false, error: 'Referral code not found. Complete registration first.' },
        { status: 404 }
      );
    }

    // Build card data
    const cardData = {
      userId: user.id,
      sovereignNumber: profile?.sovereign_number || 1,
      referralCode: referralCode.code,
      referralLink: generateReferralLink(referralCode.code),
      hasVibeAnalysis: !!latestAnalysis,
      analysis: latestAnalysis ? {
        primary: latestAnalysis.vibe_type as VibeArchetype,
        secondary: latestAnalysis.secondary_vibe as VibeArchetype,
        confidence: latestAnalysis.confidence,
        traits: latestAnalysis.traits || [],
        colorPalette: latestAnalysis.color_palette || [],
        description: latestAnalysis.description,
        koreanDescription: latestAnalysis.description_ko,
      } : null,
    };

    return NextResponse.json({
      success: true,
      cardData,
      shareText: generateShareText(
        cardData.sovereignNumber,
        cardData.analysis?.primary || 'urban-explorer',
        cardData.referralCode
      ),
    });
  } catch (error) {
    console.error('[Viral Card API] GET Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// POST: Save new viral card from analysis
// ============================================

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      // ========================================
      // Save VIBE-ID Analysis
      // ========================================
      case 'save-analysis': {
        const { analysis } = body as { analysis: VibeAnalysis };

        if (!analysis || !analysis.primary) {
          return NextResponse.json(
            { success: false, error: 'Invalid analysis data' },
            { status: 400 }
          );
        }

        // Save to vibe_analyses table
        const { data, error } = await supabase
          .from('vibe_analyses')
          .upsert({
            user_id: user.id,
            vibe_type: analysis.primary,
            secondary_vibe: analysis.secondary,
            confidence: analysis.confidence,
            traits: analysis.traits,
            color_palette: analysis.colorPalette,
            description: analysis.description,
            description_ko: analysis.koreanDescription,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id',
          })
          .select()
          .single();

        if (error) {
          console.error('[Viral Card API] Save analysis error:', error);
          return NextResponse.json(
            { success: false, error: 'Failed to save analysis' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: 'Analysis saved',
          analysisId: data?.id,
        });
      }

      // ========================================
      // Track Share Event
      // ========================================
      case 'track-share': {
        const { platform, cardId } = body;

        // Log share event for analytics
        await supabase.from('share_events').insert({
          user_id: user.id,
          card_id: cardId || generateCardId(),
          platform: platform || 'unknown',
          created_at: new Date().toISOString(),
        });

        return NextResponse.json({
          success: true,
          message: 'Share tracked',
        });
      }

      // ========================================
      // Generate Fresh Card
      // ========================================
      case 'generate-card': {
        // Get user's profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('sovereign_number')
          .eq('user_id', user.id)
          .single();

        // Get or create referral code
        let { data: referralCode } = await supabase
          .from('referral_codes')
          .select('code')
          .eq('user_id', user.id)
          .single();

        if (!referralCode) {
          // Generate new referral code
          const newCode = `F9-${user.id.slice(0, 6).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
          await supabase.from('referral_codes').insert({
            user_id: user.id,
            code: newCode,
          });
          referralCode = { code: newCode };
        }

        // Get latest analysis
        const { data: latestAnalysis } = await supabase
          .from('vibe_analyses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const cardId = generateCardId();

        return NextResponse.json({
          success: true,
          card: {
            userId: user.id,
            sovereignNumber: profile?.sovereign_number || 1,
            referralCode: referralCode.code,
            referralLink: generateReferralLink(referralCode.code),
            cardId,
            analysis: latestAnalysis ? {
              primary: latestAnalysis.vibe_type,
              secondary: latestAnalysis.secondary_vibe,
              confidence: latestAnalysis.confidence,
              traits: latestAnalysis.traits,
              colorPalette: latestAnalysis.color_palette,
              description: latestAnalysis.description,
              koreanDescription: latestAnalysis.description_ko,
            } : null,
          },
          shareText: generateShareText(
            profile?.sovereign_number || 1,
            latestAnalysis?.vibe_type || 'urban-explorer',
            referralCode.code
          ),
        });
      }

      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action',
            validActions: ['save-analysis', 'track-share', 'generate-card'],
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[Viral Card API] POST Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================
// Generate Share Text
// ============================================

function generateShareText(
  sovereignNumber: number,
  vibeType: VibeArchetype,
  referralCode: string
): { en: string; ko: string } {
  const vibeLabel = VIBE_LABELS[vibeType] || VIBE_LABELS['urban-explorer'];
  const link = generateReferralLink(referralCode);

  return {
    en: `✨ My VIBE-ID reveals I'm a ${vibeLabel.en}!

Discover your unique travel aura at Field Nine.

🎁 Join as Sovereign #${sovereignNumber}'s guest and get exclusive rewards!

${link}

#FieldNine #VIBEID #TravelAura`,
    ko: `✨ VIBE-ID 분석 결과: ${vibeLabel.ko}!

나만의 여행 아우라를 발견하세요.

🎁 Sovereign #${sovereignNumber}의 게스트로 가입하고 특별 보상을 받으세요!

${link}

#FieldNine #VIBEID #여행`,
  };
}
