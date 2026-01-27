-- ═══════════════════════════════════════════════════════════════════════════════
-- PHASE 58: NFT MARKETPLACE SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════════
--
-- Tables:
--   1. nft_collections - NFT collection metadata
--   2. nft_items - Individual NFT tokens
--   3. nft_listings - Marketplace listings
--   4. nft_bids - Auction bids
--   5. nft_activities - Activity history
--   6. nft_favorites - User favorites
--
-- ═══════════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════════
-- ENUM TYPES
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
  CREATE TYPE nft_category AS ENUM (
    'ENERGY',
    'AVATAR',
    'BADGE',
    'LAND',
    'UTILITY',
    'COLLECTIBLE'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE nft_rarity AS ENUM (
    'COMMON',
    'UNCOMMON',
    'RARE',
    'EPIC',
    'LEGENDARY',
    'MYTHIC'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM (
    'ACTIVE',
    'SOLD',
    'CANCELLED',
    'EXPIRED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE auction_type AS ENUM (
    'FIXED',
    'AUCTION',
    'DUTCH'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE bid_status AS ENUM (
    'ACTIVE',
    'ACCEPTED',
    'OUTBID',
    'CANCELLED',
    'EXPIRED'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE activity_type AS ENUM (
    'MINT',
    'LIST',
    'UNLIST',
    'BID',
    'SALE',
    'TRANSFER',
    'BURN'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. NFT COLLECTIONS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS nft_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic Info
  name VARCHAR(255) NOT NULL,
  name_ko VARCHAR(255),
  description TEXT,
  description_ko TEXT,

  -- Images
  image_url TEXT,
  banner_url TEXT,

  -- Creator Info
  creator_address VARCHAR(255),
  creator_name VARCHAR(255),

  -- Supply Info
  total_supply INTEGER DEFAULT 0,
  minted_count INTEGER DEFAULT 0,
  owner_count INTEGER DEFAULT 0,

  -- Pricing
  floor_price DECIMAL(20, 8) DEFAULT 0,
  volume_total DECIMAL(20, 8) DEFAULT 0,
  volume_24h DECIMAL(20, 8) DEFAULT 0,

  -- Settings
  royalty_percent DECIMAL(5, 2) DEFAULT 5.00,
  category nft_category DEFAULT 'COLLECTIBLE',

  -- Flags
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,

  -- Blockchain
  contract_address VARCHAR(255),
  chain_id INTEGER DEFAULT 42161, -- Arbitrum

  -- Minting Schedule
  mint_start_at TIMESTAMPTZ,
  mint_end_at TIMESTAMPTZ,
  mint_price DECIMAL(20, 8) DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for collections
CREATE INDEX IF NOT EXISTS idx_nft_collections_category ON nft_collections(category);
CREATE INDEX IF NOT EXISTS idx_nft_collections_featured ON nft_collections(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS idx_nft_collections_volume ON nft_collections(volume_24h DESC);
CREATE INDEX IF NOT EXISTS idx_nft_collections_floor ON nft_collections(floor_price DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. NFT ITEMS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS nft_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Collection Reference
  collection_id UUID REFERENCES nft_collections(id) ON DELETE CASCADE,
  token_id VARCHAR(255) NOT NULL,

  -- Basic Info
  name VARCHAR(255) NOT NULL,
  name_ko VARCHAR(255),
  description TEXT,
  description_ko TEXT,

  -- Media
  image_url TEXT,
  animation_url TEXT,
  external_url TEXT,

  -- Classification
  category nft_category DEFAULT 'COLLECTIBLE',
  rarity nft_rarity DEFAULT 'COMMON',

  -- Attributes (JSONB for flexibility)
  attributes JSONB DEFAULT '[]'::JSONB,

  -- Ownership
  owner_id UUID REFERENCES auth.users(id),
  owner_address VARCHAR(255),
  owner_name VARCHAR(255),

  -- Creator
  creator_id UUID REFERENCES auth.users(id),
  creator_address VARCHAR(255),
  creator_name VARCHAR(255),

  -- Royalty
  royalty_percent DECIMAL(5, 2) DEFAULT 5.00,

  -- Utility
  utility JSONB, -- { type: 'discount', value: 10, description: '10% off' }

  -- Blockchain
  chain_id INTEGER DEFAULT 42161,
  contract_address VARCHAR(255),
  mint_tx_hash VARCHAR(255),

  -- Stats
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,

  -- Timestamps
  last_transfer_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(collection_id, token_id)
);

-- Indexes for NFT items
CREATE INDEX IF NOT EXISTS idx_nft_items_collection ON nft_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_nft_items_owner ON nft_items(owner_id);
CREATE INDEX IF NOT EXISTS idx_nft_items_category ON nft_items(category);
CREATE INDEX IF NOT EXISTS idx_nft_items_rarity ON nft_items(rarity);
CREATE INDEX IF NOT EXISTS idx_nft_items_created ON nft_items(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. NFT LISTINGS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS nft_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- NFT Reference
  nft_id UUID REFERENCES nft_items(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES nft_collections(id),

  -- Seller
  seller_id UUID REFERENCES auth.users(id),
  seller_address VARCHAR(255),
  seller_name VARCHAR(255),

  -- Pricing
  price DECIMAL(20, 8) NOT NULL,
  currency VARCHAR(20) DEFAULT 'KAUS',

  -- Auction Settings
  auction_type auction_type DEFAULT 'FIXED',
  min_bid_increment DECIMAL(20, 8) DEFAULT 0,
  reserve_price DECIMAL(20, 8),

  -- Dutch Auction
  start_price DECIMAL(20, 8),
  end_price DECIMAL(20, 8),
  price_decay_rate DECIMAL(10, 4),

  -- Status
  status listing_status DEFAULT 'ACTIVE',

  -- Timing
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  -- Sale Info
  buyer_id UUID REFERENCES auth.users(id),
  buyer_address VARCHAR(255),
  sale_price DECIMAL(20, 8),
  sale_tx_hash VARCHAR(255),
  sold_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for listings
CREATE INDEX IF NOT EXISTS idx_nft_listings_nft ON nft_listings(nft_id);
CREATE INDEX IF NOT EXISTS idx_nft_listings_seller ON nft_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_nft_listings_status ON nft_listings(status) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_nft_listings_price ON nft_listings(price ASC) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_nft_listings_expires ON nft_listings(expires_at) WHERE status = 'ACTIVE';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. NFT BIDS TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS nft_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  listing_id UUID REFERENCES nft_listings(id) ON DELETE CASCADE,
  nft_id UUID REFERENCES nft_items(id),

  -- Bidder
  bidder_id UUID REFERENCES auth.users(id),
  bidder_address VARCHAR(255),
  bidder_name VARCHAR(255),

  -- Bid Info
  amount DECIMAL(20, 8) NOT NULL,
  currency VARCHAR(20) DEFAULT 'KAUS',

  -- Status
  status bid_status DEFAULT 'ACTIVE',

  -- Result
  tx_hash VARCHAR(255),

  -- Timestamps
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for bids
CREATE INDEX IF NOT EXISTS idx_nft_bids_listing ON nft_bids(listing_id);
CREATE INDEX IF NOT EXISTS idx_nft_bids_bidder ON nft_bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_nft_bids_amount ON nft_bids(listing_id, amount DESC);
CREATE INDEX IF NOT EXISTS idx_nft_bids_status ON nft_bids(status) WHERE status = 'ACTIVE';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. NFT ACTIVITIES TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS nft_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- NFT Reference
  nft_id UUID REFERENCES nft_items(id) ON DELETE CASCADE,
  collection_id UUID REFERENCES nft_collections(id),
  listing_id UUID REFERENCES nft_listings(id),

  -- Activity Type
  activity_type activity_type NOT NULL,

  -- Participants
  from_address VARCHAR(255),
  from_name VARCHAR(255),
  to_address VARCHAR(255),
  to_name VARCHAR(255),

  -- Value
  price DECIMAL(20, 8),
  currency VARCHAR(20),

  -- Blockchain
  tx_hash VARCHAR(255),
  block_number BIGINT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for activities
CREATE INDEX IF NOT EXISTS idx_nft_activities_nft ON nft_activities(nft_id);
CREATE INDEX IF NOT EXISTS idx_nft_activities_collection ON nft_activities(collection_id);
CREATE INDEX IF NOT EXISTS idx_nft_activities_type ON nft_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_nft_activities_created ON nft_activities(created_at DESC);

-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. NFT FAVORITES TABLE
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS nft_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nft_id UUID REFERENCES nft_items(id) ON DELETE CASCADE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint
  UNIQUE(user_id, nft_id)
);

-- Indexes for favorites
CREATE INDEX IF NOT EXISTS idx_nft_favorites_user ON nft_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_nft_favorites_nft ON nft_favorites(nft_id);

-- ═══════════════════════════════════════════════════════════════════════════════
-- HELPER FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Function to update collection stats after sale
CREATE OR REPLACE FUNCTION update_collection_volume()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'SOLD' AND OLD.status = 'ACTIVE' THEN
    UPDATE nft_collections
    SET
      volume_total = volume_total + NEW.sale_price,
      volume_24h = volume_24h + NEW.sale_price,
      updated_at = NOW()
    WHERE id = NEW.collection_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for volume updates
DROP TRIGGER IF EXISTS trigger_update_collection_volume ON nft_listings;
CREATE TRIGGER trigger_update_collection_volume
  AFTER UPDATE ON nft_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_volume();

-- Function to update floor price
CREATE OR REPLACE FUNCTION update_collection_floor_price()
RETURNS TRIGGER AS $$
DECLARE
  new_floor DECIMAL(20, 8);
BEGIN
  -- Calculate new floor price from active listings
  SELECT MIN(price) INTO new_floor
  FROM nft_listings l
  JOIN nft_items n ON l.nft_id = n.id
  WHERE n.collection_id = COALESCE(NEW.collection_id, OLD.collection_id)
    AND l.status = 'ACTIVE';

  UPDATE nft_collections
  SET
    floor_price = COALESCE(new_floor, 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.collection_id, OLD.collection_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for floor price updates
DROP TRIGGER IF EXISTS trigger_update_floor_on_insert ON nft_listings;
CREATE TRIGGER trigger_update_floor_on_insert
  AFTER INSERT ON nft_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_floor_price();

DROP TRIGGER IF EXISTS trigger_update_floor_on_update ON nft_listings;
CREATE TRIGGER trigger_update_floor_on_update
  AFTER UPDATE OF status, price ON nft_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_collection_floor_price();

-- Function to increment NFT view count
CREATE OR REPLACE FUNCTION increment_nft_view(nft_uuid UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE nft_items
  SET view_count = view_count + 1
  WHERE id = nft_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to toggle favorite
CREATE OR REPLACE FUNCTION toggle_nft_favorite(user_uuid UUID, nft_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_favorited BOOLEAN;
BEGIN
  -- Check if already favorited
  SELECT EXISTS(
    SELECT 1 FROM nft_favorites
    WHERE user_id = user_uuid AND nft_id = nft_uuid
  ) INTO is_favorited;

  IF is_favorited THEN
    -- Remove favorite
    DELETE FROM nft_favorites WHERE user_id = user_uuid AND nft_id = nft_uuid;
    UPDATE nft_items SET favorite_count = favorite_count - 1 WHERE id = nft_uuid;
    RETURN FALSE;
  ELSE
    -- Add favorite
    INSERT INTO nft_favorites (user_id, nft_id) VALUES (user_uuid, nft_uuid);
    UPDATE nft_items SET favorite_count = favorite_count + 1 WHERE id = nft_uuid;
    RETURN TRUE;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE nft_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_favorites ENABLE ROW LEVEL SECURITY;

-- Collections: Public read, admin write
CREATE POLICY "Collections are viewable by everyone" ON nft_collections
  FOR SELECT USING (true);

CREATE POLICY "Collections can be created by admins" ON nft_collections
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Collections can be updated by admins" ON nft_collections
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- NFT Items: Public read, owner/creator write
CREATE POLICY "NFTs are viewable by everyone" ON nft_items
  FOR SELECT USING (true);

CREATE POLICY "NFTs can be created by authenticated users" ON nft_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "NFTs can be updated by owner" ON nft_items
  FOR UPDATE USING (owner_id = auth.uid());

-- Listings: Public read, seller write
CREATE POLICY "Listings are viewable by everyone" ON nft_listings
  FOR SELECT USING (true);

CREATE POLICY "Listings can be created by NFT owners" ON nft_listings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM nft_items WHERE id = nft_id AND owner_id = auth.uid())
  );

CREATE POLICY "Listings can be updated by seller" ON nft_listings
  FOR UPDATE USING (seller_id = auth.uid());

-- Bids: Public read, bidder write
CREATE POLICY "Bids are viewable by everyone" ON nft_bids
  FOR SELECT USING (true);

CREATE POLICY "Bids can be created by authenticated users" ON nft_bids
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Bids can be updated by bidder" ON nft_bids
  FOR UPDATE USING (bidder_id = auth.uid());

-- Activities: Public read only
CREATE POLICY "Activities are viewable by everyone" ON nft_activities
  FOR SELECT USING (true);

CREATE POLICY "Activities can be inserted by service" ON nft_activities
  FOR INSERT WITH CHECK (true);

-- Favorites: User specific
CREATE POLICY "Users can view their favorites" ON nft_favorites
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their favorites" ON nft_favorites
  FOR ALL USING (user_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════════════════════
-- SAMPLE DATA (Optional - for testing)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Insert sample collection
INSERT INTO nft_collections (
  name, name_ko, description, description_ko,
  image_url, banner_url,
  creator_name, total_supply,
  category, is_verified, is_featured
) VALUES (
  'KAUS Genesis',
  'KAUS 제네시스',
  'The founding collection of KAUS Energy Tokens',
  'KAUS 에너지 토큰의 창립 컬렉션',
  'https://m.fieldnine.io/nft/genesis-thumb.png',
  'https://m.fieldnine.io/nft/genesis-banner.png',
  'Field Nine',
  1000,
  'ENERGY',
  TRUE,
  TRUE
) ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE nft_collections IS 'NFT collection metadata and statistics';
COMMENT ON TABLE nft_items IS 'Individual NFT tokens with ownership tracking';
COMMENT ON TABLE nft_listings IS 'Active and historical marketplace listings';
COMMENT ON TABLE nft_bids IS 'Auction bids on NFT listings';
COMMENT ON TABLE nft_activities IS 'Historical activity log for all NFT operations';
COMMENT ON TABLE nft_favorites IS 'User favorite NFTs for quick access';

-- ═══════════════════════════════════════════════════════════════════════════════
-- END PHASE 58 SCHEMA
-- ═══════════════════════════════════════════════════════════════════════════════
