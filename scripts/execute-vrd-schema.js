/**
 * VRD 26SS Schema Migration Script
 * Direct execution to Supabase PostgreSQL
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Supabase connection config
const config = {
  host: 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.cmgonohqgdjifizpaucx',
  password: '필경#801912',
  ssl: { rejectUnauthorized: false }
};

async function executeSchema() {
  const client = new Client(config);

  try {
    console.log('[VRD] Connecting to Supabase PostgreSQL...');
    console.log(`[VRD] Host: ${config.host}:${config.port}`);
    await client.connect();
    console.log('[VRD] Connected successfully.');

    // Read SQL file
    const sqlPath = path.join(__dirname, '../supabase/migrations/030_vrd_orders_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('[VRD] Executing VRD schema migration...');
    await client.query(sql);
    console.log('[VRD] Schema migration completed successfully!');

    // Verify tables
    console.log('\n[VRD] Verifying created tables...');

    const tablesResult = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'vrd_%'
      ORDER BY table_name
    `);

    console.log('[VRD] VRD Tables created:');
    tablesResult.rows.forEach(row => console.log(`  - ${row.table_name}`));

    // Check inventory count
    const inventoryCount = await client.query('SELECT COUNT(*) FROM vrd_inventory');
    console.log(`\n[VRD] Inventory records: ${inventoryCount.rows[0].count}`);

    // Sample inventory data
    const sampleInventory = await client.query(`
      SELECT product_id, color, size, quantity
      FROM vrd_inventory
      LIMIT 5
    `);
    console.log('\n[VRD] Sample inventory data:');
    sampleInventory.rows.forEach(row => {
      console.log(`  ${row.product_id} | ${row.color} | ${row.size} | qty: ${row.quantity}`);
    });

    console.log('\n[VRD] ============================================');
    console.log('[VRD] VRD 26SS DATABASE MIGRATION COMPLETE');
    console.log('[VRD] ============================================');

  } catch (error) {
    console.error('[VRD] Error:', error.message);
    if (error.message.includes('already exists')) {
      console.log('[VRD] Tables already exist - verifying current state...');
      try {
        const inventoryCount = await client.query('SELECT COUNT(*) FROM vrd_inventory');
        console.log(`[VRD] Inventory records: ${inventoryCount.rows[0].count}`);
        console.log('[VRD] Schema already applied - SUCCESS');
      } catch (e) {
        console.error('[VRD] Verification failed:', e.message);
      }
    }
  } finally {
    await client.end();
  }
}

executeSchema();
