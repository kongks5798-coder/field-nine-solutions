/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 58: NFT COLLECTIONS API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * GET /api/nft/collections - List all collections
 * GET /api/nft/collections?featured=true - Featured collections
 * GET /api/nft/collections?trending=true - Trending by 24h volume
 * POST /api/nft/collections - Create new collection (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ═══════════════════════════════════════════════════════════════════════════════
// SUPABASE ADMIN CLIENT
// ═══════════════════════════════════════════════════════════════════════════════

const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase credentials not configured');
  return createClient(url, key);
};

// ═══════════════════════════════════════════════════════════════════════════════
// GET - List Collections
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get('featured') === 'true';
    const trending = searchParams.get('trending') === 'true';
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabaseAdmin = getSupabaseAdmin();

    // Build query
    let query = supabaseAdmin
      .from('nft_collections')
      .select('*', { count: 'exact' });

    // Apply filters
    if (featured) {
      query = query.eq('is_featured', true);
    }

    if (category) {
      query = query.eq('category', category.toUpperCase());
    }

    // Apply sorting
    if (trending) {
      query = query.order('volume_24h', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: collections, error, count } = await query;

    if (error) {
      console.error('[NFT Collections API] Error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch collections' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      collections: collections.map(c => ({
        id: c.id,
        name: c.name,
        nameKo: c.name_ko,
        description: c.description,
        descriptionKo: c.description_ko,
        image: c.image_url,
        bannerImage: c.banner_url,
        creator: c.creator_address,
        creatorName: c.creator_name,
        totalSupply: c.total_supply,
        mintedCount: c.minted_count,
        ownerCount: c.owner_count,
        floorPrice: c.floor_price,
        volumeTotal: c.volume_total,
        volume24h: c.volume_24h,
        royaltyPercent: c.royalty_percent,
        category: c.category,
        isVerified: c.is_verified,
        isFeatured: c.is_featured,
        contractAddress: c.contract_address,
        chainId: c.chain_id,
        createdAt: c.created_at,
        mintStartAt: c.mint_start_at,
        mintEndAt: c.mint_end_at,
      })),
      pagination: {
        limit,
        offset,
        total: count || 0,
      },
    });

  } catch (error) {
    console.error('[NFT Collections API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST - Create Collection (Admin Only)
// ═══════════════════════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll() {},
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin (in production, check role)
    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.category) {
      return NextResponse.json(
        { success: false, error: 'Name and category are required' },
        { status: 400 }
      );
    }

    // Create collection
    const { data: collection, error: insertError } = await supabaseAdmin
      .from('nft_collections')
      .insert({
        name: body.name,
        name_ko: body.nameKo || body.name,
        description: body.description || '',
        description_ko: body.descriptionKo || body.description || '',
        image_url: body.image || '',
        banner_url: body.bannerImage || '',
        creator_address: body.creatorAddress || user.id,
        creator_name: body.creatorName || 'Field Nine',
        total_supply: body.totalSupply || 0,
        minted_count: 0,
        owner_count: 0,
        floor_price: body.floorPrice || 0,
        volume_total: 0,
        volume_24h: 0,
        royalty_percent: body.royaltyPercent || 5,
        category: body.category.toUpperCase(),
        is_verified: false,
        is_featured: false,
        contract_address: body.contractAddress || null,
        chain_id: body.chainId || 42161, // Arbitrum default
        mint_start_at: body.mintStartAt || null,
        mint_end_at: body.mintEndAt || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[NFT Collections API] Insert error:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create collection' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      collection: {
        id: collection.id,
        name: collection.name,
        nameKo: collection.name_ko,
        category: collection.category,
        createdAt: collection.created_at,
      },
    });

  } catch (error) {
    console.error('[NFT Collections API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
