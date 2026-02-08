/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 58: NFT ITEMS API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * GET /api/nft/items - List NFTs with filters
 * GET /api/nft/items?owner=user_id - User's NFTs
 * GET /api/nft/items?collection=col_id - Collection NFTs
 * POST /api/nft/items - Mint new NFT
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
// GET - List NFT Items
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const owner = searchParams.get('owner');
    const collection = searchParams.get('collection');
    const category = searchParams.get('category');
    const rarity = searchParams.get('rarity');
    const forSale = searchParams.get('forSale') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabaseAdmin = getSupabaseAdmin();

    // Single NFT lookup
    if (id) {
      const { data: nft, error } = await supabaseAdmin
        .from('nft_items')
        .select(`
          *,
          collection:nft_collections(id, name, name_ko, creator_name, royalty_percent),
          listing:nft_listings(id, price, currency, auction_type, status, expires_at)
        `)
        .eq('id', id)
        .single();

      if (error || !nft) {
        return NextResponse.json(
          { success: false, error: 'NFT not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        nft: formatNFT(nft),
      });
    }

    // Build query for multiple NFTs
    let query = supabaseAdmin
      .from('nft_items')
      .select(`
        *,
        collection:nft_collections(id, name, name_ko, creator_name),
        listing:nft_listings(id, price, currency, auction_type, status)
      `, { count: 'exact' });

    // Apply filters
    if (owner) {
      query = query.eq('owner_id', owner);
    }

    if (collection) {
      query = query.eq('collection_id', collection);
    }

    if (category) {
      query = query.eq('category', category.toUpperCase());
    }

    if (rarity) {
      query = query.eq('rarity', rarity.toUpperCase());
    }

    if (forSale) {
      query = query.not('listing', 'is', null);
    }

    // Order and paginate
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: nfts, error, count } = await query;

    if (error) {
      console.error('[NFT Items API] Error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch NFTs' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      nfts: nfts.map(formatNFT),
      pagination: {
        limit,
        offset,
        total: count || 0,
      },
    });

  } catch (error) {
    console.error('[NFT Items API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST - Mint NFT
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

    const body = await request.json();

    // Validate required fields
    if (!body.collectionId || !body.name) {
      return NextResponse.json(
        { success: false, error: 'Collection ID and name are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get collection details
    const { data: collection, error: collectionError } = await supabaseAdmin
      .from('nft_collections')
      .select('*')
      .eq('id', body.collectionId)
      .single();

    if (collectionError || !collection) {
      return NextResponse.json(
        { success: false, error: 'Collection not found' },
        { status: 404 }
      );
    }

    // Check if minting is allowed
    if (collection.total_supply > 0 && collection.minted_count >= collection.total_supply) {
      return NextResponse.json(
        { success: false, error: 'Collection is sold out' },
        { status: 400 }
      );
    }

    // Generate token ID
    const tokenId = (collection.minted_count + 1).toString();

    // Create NFT
    const { data: nft, error: insertError } = await supabaseAdmin
      .from('nft_items')
      .insert({
        collection_id: body.collectionId,
        token_id: tokenId,
        name: body.name,
        name_ko: body.nameKo || body.name,
        description: body.description || '',
        description_ko: body.descriptionKo || body.description || '',
        image_url: body.image || collection.image_url,
        animation_url: body.animationUrl || null,
        category: collection.category,
        rarity: body.rarity || 'COMMON',
        attributes: body.attributes || [],
        owner_id: user.id,
        owner_name: body.ownerName || 'User',
        creator_id: user.id,
        creator_name: body.creatorName || 'User',
        royalty_percent: collection.royalty_percent,
        utility: body.utility || null,
        chain_id: collection.chain_id,
        contract_address: collection.contract_address,
        mint_tx_hash: body.txHash || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('[NFT Items API] Insert error:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to mint NFT' },
        { status: 500 }
      );
    }

    // Update collection minted count
    await supabaseAdmin
      .from('nft_collections')
      .update({
        minted_count: collection.minted_count + 1,
        owner_count: collection.owner_count + 1,
      })
      .eq('id', body.collectionId);

    // Record activity
    await supabaseAdmin
      .from('nft_activities')
      .insert({
        nft_id: nft.id,
        activity_type: 'MINT',
        from_address: collection.creator_address,
        from_name: collection.creator_name,
        to_address: user.id,
        to_name: body.ownerName || 'User',
        tx_hash: body.txHash || null,
      });

    return NextResponse.json({
      success: true,
      nft: {
        id: nft.id,
        tokenId: nft.token_id,
        name: nft.name,
        nameKo: nft.name_ko,
        rarity: nft.rarity,
        category: nft.category,
        createdAt: nft.created_at,
      },
    });

  } catch (error) {
    console.error('[NFT Items API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatNFT(nft: any) {
  const activeListing = nft.listing?.find((l: { status: string }) => l.status === 'ACTIVE');

  return {
    id: nft.id,
    tokenId: nft.token_id,
    name: nft.name,
    nameKo: nft.name_ko,
    description: nft.description,
    descriptionKo: nft.description_ko,
    image: nft.image_url,
    animationUrl: nft.animation_url,
    category: nft.category,
    rarity: nft.rarity,
    attributes: nft.attributes || [],
    collectionId: nft.collection_id,
    collectionName: nft.collection?.name_ko || nft.collection?.name,
    owner: nft.owner_id,
    ownerName: nft.owner_name,
    creator: nft.creator_id,
    creatorName: nft.creator_name,
    royaltyPercent: nft.royalty_percent,
    mintedAt: nft.created_at,
    lastTransferAt: nft.last_transfer_at,
    viewCount: nft.view_count || 0,
    favoriteCount: nft.favorite_count || 0,
    utility: nft.utility,
    chainId: nft.chain_id,
    contractAddress: nft.contract_address,
    listing: activeListing ? {
      id: activeListing.id,
      price: activeListing.price,
      currency: activeListing.currency,
      auctionType: activeListing.auction_type,
      expiresAt: activeListing.expires_at,
    } : null,
  };
}
