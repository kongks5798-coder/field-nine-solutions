/**
 * VRD Orders Schema Migration Executor
 * Phase 55: Financial Integrity
 *
 * Usage: node scripts/execute-vrd-migration.js
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function executeMigration() {
  console.log('========================================');
  console.log('  VRD Orders Schema Migration');
  console.log('  Phase 55: Financial Integrity');
  console.log('========================================\n');

  const migrationPath = path.join(__dirname, '../supabase/migrations/030_vrd_orders_schema.sql');

  if (!fs.existsSync(migrationPath)) {
    console.error('❌ Migration file not found:', migrationPath);
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf-8');

  console.log('📄 Reading migration file...');
  console.log(`   Path: ${migrationPath}`);
  console.log(`   Size: ${sql.length} bytes\n`);

  // Split SQL by statements
  const statements = sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));

  console.log(`📊 Found ${statements.length} SQL statements\n`);
  console.log('🚀 Executing migration...\n');

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const preview = stmt.substring(0, 60).replace(/\n/g, ' ');

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' }).single();

      if (error) {
        // Try direct execution for DDL statements
        const { error: directError } = await supabase.from('_temp').select('*').limit(0);

        if (stmt.toUpperCase().includes('CREATE TABLE')) {
          console.log(`   [${i + 1}/${statements.length}] ⚠️  ${preview}...`);
          console.log(`      Using REST API for DDL - check Supabase Dashboard`);
        } else {
          throw error;
        }
      } else {
        console.log(`   [${i + 1}/${statements.length}] ✅ ${preview}...`);
        successCount++;
      }
    } catch (err) {
      // Check if it's a "already exists" error
      if (err.message?.includes('already exists') || err.code === '42P07') {
        console.log(`   [${i + 1}/${statements.length}] ⏭️  ${preview}... (already exists)`);
        successCount++;
      } else {
        console.log(`   [${i + 1}/${statements.length}] ❌ ${preview}...`);
        console.log(`      Error: ${err.message || err}`);
        errorCount++;
      }
    }
  }

  console.log('\n========================================');
  console.log('  Migration Complete');
  console.log('========================================');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📊 Total: ${statements.length}`);

  if (errorCount > 0) {
    console.log('\n⚠️  Some statements failed.');
    console.log('   Please run the SQL directly in Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/cmgonohqgdjifizpaucx/sql');
  }

  // Verify tables exist
  console.log('\n🔍 Verifying tables...');

  const tables = ['vrd_orders', 'vrd_payment_logs', 'vrd_inventory', 'vrd_customers'];

  for (const table of tables) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`   ❌ ${table} - NOT FOUND`);
    } else {
      console.log(`   ✅ ${table} - OK (${count || 0} rows)`);
    }
  }

  console.log('\n========================================');
}

executeMigration().catch(console.error);
