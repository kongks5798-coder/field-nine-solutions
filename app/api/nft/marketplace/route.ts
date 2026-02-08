/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * PHASE 58: NFT MARKETPLACE API
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * GET /api/nft/marketplace - Get active listings
 * POST /api/nft/marketplace - Create listing (sell NFT)
 * POST /api/nft/marketplace/bid - Place bid on auction
 * POST /api/nft/marketplace/buy - Buy NFT at fixed price
 * DELETE /api/nft/marketplace?id=listing_id - Cancel listing
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
// GET - List Active Marketplace Listings
// ═══════════════════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectionId = searchParams.get('collection');
    const auctionType = searchParams.get('type'); // FIXED, AUCTION, DUTCH
    const category = searchParams.get('category');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sort') || 'recent'; // recent, price_low, price_high, ending_soon
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabaseAdmin = getSupabaseAdmin();

    // Build query
    let query = supabaseAdmin
      .from('nft_listings')
      .select(`
        *,
        nft:nft_items(
          id, token_id, name, name_ko, image_url, category, rarity, attributes, utility,
          owner_name, creator_name,
          collection:nft_collections(id, name, name_ko)
        )
      `, { count: 'exact' })
      .eq('status', 'ACTIVE');

    // Apply filters
    if (collectionId) {
      query = query.eq('nft.collection_id', collectionId);
    }

    if (auctionType) {
      query = query.eq('auction_type', auctionType.toUpperCase());
    }

    if (category) {
      query = query.eq('nft.category', category.toUpperCase());
    }

    if (minPrice) {
      query = query.gte('price', parseInt(minPrice));
    }

    if (maxPrice) {
      query = query.lte('price', parseInt(maxPrice));
    }

    // Apply sorting
    switch (sortBy) {
      case 'price_low':
        query = query.order('price', { ascending: true });
        break;
      case 'price_high':
        query = query.order('price', { ascending: false });
        break;
      case 'ending_soon':
        query = query.order('expires_at', { ascending: true });
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: listings, error, count } = await query;

    if (error) {
      console.error('[NFT Marketplace API] Error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch listings' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      listings: listings.map(formatListing),
      pagination: {
        limit,
        offset,
        total: count || 0,
      },
    });

  } catch (error) {
    console.error('[NFT Marketplace API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// POST - Create Listing (Sell NFT)
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

    // Check for action type
    if (body.action === 'bid') {
      return handleBid(user, body);
    }

    if (body.action === 'buy') {
      return handleBuy(user, body);
    }

    // Default: Create listing
    return handleCreateListing(user, body);

  } catch (error) {
    console.error('[NFT Marketplace API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// DELETE - Cancel Listing
// ═══════════════════════════════════════════════════════════════════════════════

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('id');

    if (!listingId) {
      return NextResponse.json(
        { success: false, error: 'Listing ID required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get listing and verify ownership
    const { data: listing, error: fetchError } = await supabaseAdmin
      .from('nft_listings')
      .select('*, nft:nft_items(owner_id)')
      .eq('id', listingId)
      .single();

    if (fetchError || !listing) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (listing.seller_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to cancel this listing' },
        { status: 403 }
      );
    }

    if (listing.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Listing is not active' },
        { status: 400 }
      );
    }

    // Cancel listing
    const { error: updateError } = await supabaseAdmin
      .from('nft_listings')
      .update({
        status: 'CANCELLED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', listingId);

    if (updateError) {
      return NextResponse.json(
        { success: false, error: 'Failed to cancel listing' },
        { status: 500 }
      );
    }

    // Record activity
    await supabaseAdmin
      .from('nft_activities')
      .insert({
        nft_id: listing.nft_id,
        activity_type: 'CANCEL',
        from_address: user.id,
        from_name: listing.seller_name,
      });

    return NextResponse.json({
      success: true,
      message: 'Listing cancelled successfully',
    });

  } catch (error) {
    console.error('[NFT Marketplace API] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLER: Create Listing
// ═══════════════════════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCreateListing(user: any, body: any) {
  const supabaseAdmin = getSupabaseAdmin();

  // Validate required fields
  if (!body.nftId || !body.price) {
    return NextResponse.json(
      { success: false, error: 'NFT ID and price are required' },
      { status: 400 }
    );
  }

  // Get NFT and verify ownership
  const { data: nft, error: nftError } = await supabaseAdmin
    .from('nft_items')
    .select('*')
    .eq('id', body.nftId)
    .single();

  if (nftError || !nft) {
    return NextResponse.json(
      { success: false, error: 'NFT not found' },
      { status: 404 }
    );
  }

  if (nft.owner_id !== user.id) {
    return NextResponse.json(
      { success: false, error: 'You do not own this NFT' },
      { status: 403 }
    );
  }

  // Check if NFT is already listed
  const { data: existingListing } = await supabaseAdmin
    .from('nft_listings')
    .select('id')
    .eq('nft_id', body.nftId)
    .eq('status', 'ACTIVE')
    .single();

  if (existingListing) {
    return NextResponse.json(
      { success: false, error: 'NFT is already listed' },
      { status: 400 }
    );
  }

  // Calculate expiration
  const durationDays = body.duration || 7;
  const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

  // Create listing
  const { data: listing, error: insertError } = await supabaseAdmin
    .from('nft_listings')
    .insert({
      nft_id: body.nftId,
      seller_id: user.id,
      seller_name: nft.owner_name,
      price: body.price,
      currency: body.currency || 'KAUS',
      auction_type: body.auctionType || 'FIXED',
      start_price: body.auctionType === 'AUCTION' ? body.startPrice || body.price : null,
      reserve_price: body.reservePrice || null,
      status: 'ACTIVE',
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();

  if (insertError) {
    console.error('[NFT Marketplace API] Listing error:', insertError);
    return NextResponse.json(
      { success: false, error: 'Failed to create listing' },
      { status: 500 }
    );
  }

  // Record activity
  await supabaseAdmin
    .from('nft_activities')
    .insert({
      nft_id: body.nftId,
      activity_type: 'LIST',
      from_address: user.id,
      from_name: nft.owner_name,
      price: body.price,
      currency: body.currency || 'KAUS',
    });

  return NextResponse.json({
    success: true,
    listing: {
      id: listing.id,
      nftId: listing.nft_id,
      price: listing.price,
      currency: listing.currency,
      auctionType: listing.auction_type,
      expiresAt: listing.expires_at,
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLER: Place Bid
// ═══════════════════════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleBid(user: any, body: any) {
  const supabaseAdmin = getSupabaseAdmin();

  // Validate required fields
  if (!body.listingId || !body.amount) {
    return NextResponse.json(
      { success: false, error: 'Listing ID and amount are required' },
      { status: 400 }
    );
  }

  // Get listing
  const { data: listing, error: listingError } = await supabaseAdmin
    .from('nft_listings')
    .select('*')
    .eq('id', body.listingId)
    .single();

  if (listingError || !listing) {
    return NextResponse.json(
      { success: false, error: 'Listing not found' },
      { status: 404 }
    );
  }

  if (listing.status !== 'ACTIVE') {
    return NextResponse.json(
      { success: false, error: 'Listing is not active' },
      { status: 400 }
    );
  }

  if (listing.auction_type !== 'AUCTION') {
    return NextResponse.json(
      { success: false, error: 'This listing does not accept bids' },
      { status: 400 }
    );
  }

  // Check if bid is higher than current highest
  const minBid = listing.highest_bid || listing.start_price || listing.price;
  if (body.amount <= minBid) {
    return NextResponse.json(
      { success: false, error: `Bid must be higher than ${minBid} ${listing.currency}` },
      { status: 400 }
    );
  }

  // Get user's profile name
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single();

  const bidderName = profile?.display_name || 'User';

  // Create bid
  const { data: bid, error: bidError } = await supabaseAdmin
    .from('nft_bids')
    .insert({
      listing_id: body.listingId,
      bidder_id: user.id,
      bidder_name: bidderName,
      amount: body.amount,
      currency: listing.currency,
      is_winning: true,
    })
    .select()
    .single();

  if (bidError) {
    console.error('[NFT Marketplace API] Bid error:', bidError);
    return NextResponse.json(
      { success: false, error: 'Failed to place bid' },
      { status: 500 }
    );
  }

  // Update previous winning bid
  await supabaseAdmin
    .from('nft_bids')
    .update({ is_winning: false })
    .eq('listing_id', body.listingId)
    .eq('is_winning', true)
    .neq('id', bid.id);

  // Update listing with new highest bid
  await supabaseAdmin
    .from('nft_listings')
    .update({
      highest_bid: body.amount,
      highest_bidder_id: user.id,
      bid_count: listing.bid_count + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.listingId);

  // Record activity
  await supabaseAdmin
    .from('nft_activities')
    .insert({
      nft_id: listing.nft_id,
      activity_type: 'BID',
      from_address: user.id,
      from_name: bidderName,
      price: body.amount,
      currency: listing.currency,
    });

  return NextResponse.json({
    success: true,
    bid: {
      id: bid.id,
      amount: bid.amount,
      currency: bid.currency,
      isWinning: true,
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HANDLER: Buy NFT
// ═══════════════════════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleBuy(user: any, body: any) {
  const supabaseAdmin = getSupabaseAdmin();

  // Validate required fields
  if (!body.listingId) {
    return NextResponse.json(
      { success: false, error: 'Listing ID is required' },
      { status: 400 }
    );
  }

  // Get listing with NFT details
  const { data: listing, error: listingError } = await supabaseAdmin
    .from('nft_listings')
    .select('*, nft:nft_items(*)')
    .eq('id', body.listingId)
    .single();

  if (listingError || !listing) {
    return NextResponse.json(
      { success: false, error: 'Listing not found' },
      { status: 404 }
    );
  }

  if (listing.status !== 'ACTIVE') {
    return NextResponse.json(
      { success: false, error: 'Listing is not active' },
      { status: 400 }
    );
  }

  if (listing.auction_type === 'AUCTION') {
    return NextResponse.json(
      { success: false, error: 'Cannot buy auction items directly' },
      { status: 400 }
    );
  }

  if (listing.seller_id === user.id) {
    return NextResponse.json(
      { success: false, error: 'Cannot buy your own NFT' },
      { status: 400 }
    );
  }

  // Verify buyer has enough balance (check KAUS wallet)
  const { data: wallet } = await supabaseAdmin
    .from('wallets')
    .select('id, balance')
    .eq('user_id', user.id)
    .single();

  if (!wallet || wallet.balance < listing.price) {
    return NextResponse.json(
      { success: false, error: 'Insufficient KAUS balance' },
      { status: 400 }
    );
  }

  // Get buyer profile
  const { data: buyerProfile } = await supabaseAdmin
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single();

  const buyerName = buyerProfile?.display_name || 'User';

  // Process purchase (transaction)
  // 1. Deduct from buyer
  await supabaseAdmin.rpc('deduct_wallet_balance', {
    p_wallet_id: wallet.id,
    p_amount: listing.price,
  });

  // 2. Add to seller (minus royalty)
  const royalty = listing.price * (listing.nft.royalty_percent / 100);
  const sellerAmount = listing.price - royalty;

  const { data: sellerWallet } = await supabaseAdmin
    .from('wallets')
    .select('id')
    .eq('user_id', listing.seller_id)
    .single();

  if (sellerWallet) {
    await supabaseAdmin.rpc('add_wallet_balance', {
      p_wallet_id: sellerWallet.id,
      p_amount: sellerAmount,
    });
  }

  // 3. Transfer NFT ownership
  await supabaseAdmin
    .from('nft_items')
    .update({
      owner_id: user.id,
      owner_name: buyerName,
      last_transfer_at: new Date().toISOString(),
    })
    .eq('id', listing.nft_id);

  // 4. Update listing status
  await supabaseAdmin
    .from('nft_listings')
    .update({
      status: 'SOLD',
      sold_at: new Date().toISOString(),
      buyer_id: user.id,
    })
    .eq('id', body.listingId);

  // 5. Update collection stats
  await supabaseAdmin.rpc('update_collection_volume', {
    p_collection_id: listing.nft.collection_id,
    p_amount: listing.price,
  });

  // 6. Record activity
  await supabaseAdmin
    .from('nft_activities')
    .insert({
      nft_id: listing.nft_id,
      activity_type: 'SALE',
      from_address: listing.seller_id,
      from_name: listing.seller_name,
      to_address: user.id,
      to_name: buyerName,
      price: listing.price,
      currency: listing.currency,
    });

  return NextResponse.json({
    success: true,
    purchase: {
      nftId: listing.nft_id,
      nftName: listing.nft.name_ko,
      price: listing.price,
      currency: listing.currency,
      royaltyPaid: royalty,
    },
    message: 'Purchase successful',
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatListing(listing: any) {
  const nft = listing.nft;

  return {
    id: listing.id,
    nft: nft ? {
      id: nft.id,
      tokenId: nft.token_id,
      name: nft.name,
      nameKo: nft.name_ko,
      image: nft.image_url,
      category: nft.category,
      rarity: nft.rarity,
      attributes: nft.attributes,
      utility: nft.utility,
      collectionId: nft.collection?.id,
      collectionName: nft.collection?.name_ko || nft.collection?.name,
      ownerName: nft.owner_name,
      creatorName: nft.creator_name,
    } : null,
    seller: listing.seller_id,
    sellerName: listing.seller_name,
    price: listing.price,
    currency: listing.currency,
    auctionType: listing.auction_type,
    startPrice: listing.start_price,
    highestBid: listing.highest_bid,
    highestBidder: listing.highest_bidder_id,
    bidCount: listing.bid_count,
    status: listing.status,
    listedAt: listing.created_at,
    expiresAt: listing.expires_at,
    soldAt: listing.sold_at,
  };
}
