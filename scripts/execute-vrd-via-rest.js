/**
 * VRD 26SS Schema Migration via Supabase REST API
 * Uses service_role key for admin operations
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://cmgonohqgdjifizpaucx.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZ29ub2hxZ2RqaWZpenBhdWN4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODYxMDExNiwiZXhwIjoyMDg0MTg2MTE2fQ.-07WeAS5Yn8UowdpgoX--4uYDZM6eoEd3vkF8AtPvRU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Initial inventory data
const inventoryData = [
  { product_id: 'vrd-armor-leggings', color: 'Jet Black', size: 'XS', quantity: 30 },
  { product_id: 'vrd-armor-leggings', color: 'Jet Black', size: 'S', quantity: 50 },
  { product_id: 'vrd-armor-leggings', color: 'Jet Black', size: 'M', quantity: 40 },
  { product_id: 'vrd-armor-leggings', color: 'Jet Black', size: 'L', quantity: 30 },
  { product_id: 'vrd-armor-leggings', color: 'Jet Black', size: 'XL', quantity: 20 },
  { product_id: 'vrd-armor-leggings', color: 'Deep Charcoal', size: 'S', quantity: 40 },
  { product_id: 'vrd-armor-leggings', color: 'Deep Charcoal', size: 'M', quantity: 35 },
  { product_id: 'vrd-armor-leggings', color: 'Steel Blue', size: 'S', quantity: 30 },
  { product_id: 'vrd-armor-leggings', color: 'Steel Blue', size: 'M', quantity: 25 },
  { product_id: 'vrd-signature-top', color: 'Sand Ivory', size: 'S', quantity: 60 },
  { product_id: 'vrd-signature-top', color: 'Sand Ivory', size: 'M', quantity: 50 },
  { product_id: 'vrd-signature-top', color: 'Sand Ivory', size: 'L', quantity: 40 },
  { product_id: 'vrd-signature-top', color: 'Jet Black', size: 'S', quantity: 55 },
  { product_id: 'vrd-signature-top', color: 'Jet Black', size: 'M', quantity: 45 },
  { product_id: 'vrd-vtaper-sweat', color: 'Jet Black', size: 'M', quantity: 40 },
  { product_id: 'vrd-vtaper-sweat', color: 'Jet Black', size: 'L', quantity: 30 },
  { product_id: 'vrd-vtaper-sweat', color: 'Sand Ivory', size: 'M', quantity: 40 },
  { product_id: 'vrd-vtaper-sweat', color: 'Sand Ivory', size: 'L', quantity: 30 },
  { product_id: 'vrd-giant-tee', color: 'Sand Ivory', size: 'L', quantity: 100 },
  { product_id: 'vrd-giant-tee', color: 'Sand Ivory', size: 'XL', quantity: 80 },
  { product_id: 'vrd-giant-tee', color: 'Jet Black', size: 'L', quantity: 90 },
  { product_id: 'vrd-giant-tee', color: 'Jet Black', size: 'XL', quantity: 70 },
  { product_id: 'vrd-ethereal-windbreaker', color: 'Deep Charcoal', size: 'M', quantity: 30 },
  { product_id: 'vrd-ethereal-windbreaker', color: 'Deep Charcoal', size: 'L', quantity: 25 },
  { product_id: 'vrd-ethereal-windbreaker', color: 'Sand Ivory', size: 'M', quantity: 25 },
  { product_id: 'vrd-ethereal-windbreaker', color: 'Sand Ivory', size: 'L', quantity: 20 },
  { product_id: 'vrd-aura-cap', color: 'Jet Black', size: 'FREE', quantity: 200 },
  { product_id: 'vrd-aura-cap', color: 'Sand Ivory', size: 'FREE', quantity: 150 },
  { product_id: 'vrd-aura-cap', color: 'Deep Charcoal', size: 'FREE', quantity: 100 },
];

async function checkAndInsertInventory() {
  console.log('[VRD] Checking existing tables via REST API...');

  // Check if vrd_inventory table exists by trying to query it
  const { data: existingData, error: checkError } = await supabase
    .from('vrd_inventory')
    .select('count')
    .limit(1);

  if (checkError) {
    if (checkError.message.includes('does not exist') || checkError.code === '42P01') {
      console.log('[VRD] vrd_inventory table does not exist.');
      console.log('[VRD] DDL commands require direct DB access.');
      console.log('[VRD] Please run the SQL schema manually in Supabase Dashboard.');
      console.log('[VRD] URL: https://supabase.com/dashboard/project/cmgonohqgdjifizpaucx/sql/new');
      return false;
    }
    console.log('[VRD] Error checking table:', checkError.message);
  }

  // Table exists, check if data is already there
  const { count } = await supabase
    .from('vrd_inventory')
    .select('*', { count: 'exact', head: true });

  console.log(`[VRD] Current inventory count: ${count || 0}`);

  if (count && count > 0) {
    console.log('[VRD] Inventory data already exists!');

    // Show sample data
    const { data: sampleData } = await supabase
      .from('vrd_inventory')
      .select('product_id, color, size, quantity')
      .limit(5);

    console.log('\n[VRD] Sample inventory:');
    sampleData?.forEach(row => {
      console.log(`  ${row.product_id} | ${row.color} | ${row.size} | qty: ${row.quantity}`);
    });
    return true;
  }

  // Insert inventory data
  console.log('[VRD] Inserting inventory data...');
  const { error: insertError } = await supabase
    .from('vrd_inventory')
    .upsert(inventoryData, { onConflict: 'product_id,color,size' });

  if (insertError) {
    console.error('[VRD] Insert error:', insertError.message);
    return false;
  }

  console.log(`[VRD] Inserted ${inventoryData.length} inventory records!`);
  return true;
}

async function main() {
  console.log('[VRD] ============================================');
  console.log('[VRD] VRD 26SS Infrastructure Check');
  console.log('[VRD] ============================================\n');

  const success = await checkAndInsertInventory();

  if (success) {
    // Verify final state
    const { count: ordersCount } = await supabase
      .from('vrd_orders')
      .select('*', { count: 'exact', head: true })
      .catch(() => ({ count: null }));

    const { count: inventoryCount } = await supabase
      .from('vrd_inventory')
      .select('*', { count: 'exact', head: true });

    console.log('\n[VRD] ============================================');
    console.log('[VRD] FINAL STATUS:');
    console.log(`[VRD]   vrd_orders table: ${ordersCount !== null ? 'EXISTS' : 'NOT FOUND'}`);
    console.log(`[VRD]   vrd_inventory records: ${inventoryCount || 0}`);
    console.log('[VRD] ============================================');
  }
}

main().catch(console.error);
